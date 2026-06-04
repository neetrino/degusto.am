const path = require("path");
const fs = require("fs");

// Load .env: try project root (../.. from shared/db/prisma) then cwd
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split("\n").forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith("#")) {
      const eq = t.indexOf("=");
      if (eq > 0) {
        const key = t.slice(0, eq).trim();
        let val = t.slice(eq + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  });
}
loadEnv(path.join(__dirname, "../../.env"));
loadEnv(path.join(process.cwd(), ".env"));

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const {
  FIGMA_MENU_CATEGORIES,
  LEGACY_CATEGORY_SLUGS_TO_UNPUBLISH,
  PRODUCTS_PER_CATEGORY,
} = require("./data/figma-menu-categories.cjs");
const { buildProductsForCategory } = require("./data/figma-menu-products.cjs");
const { resolveCategoryIconUrl } = require("./seed-category-icons.cjs");
const { getAttributeKeysForCategorySlug } = require("./data/food-attributes.cjs");
const { upsertFoodAttributes } = require("./lib/upsert-food-attributes.cjs");

const prisma = new PrismaClient();

const START_PRICE = 8;
const END_PRICE = 28;
const STOCK_BASE = 24;

const FOOD_OPTION_PRESETS = [
  { spicy: "not-spicy", greens: "without-greens", priceDelta: 0 },
  { spicy: "not-spicy", greens: "with-greens", priceDelta: 0.4 },
  { spicy: "spicy", greens: "without-greens", priceDelta: 0.7 },
  { spicy: "spicy", greens: "with-greens", priceDelta: 1.1 },
];

/** Rotates seed behavior: full choice, spicy-only, greens-only, or fixed (no taste UI). */
function getFoodVariantPresets(productIndex) {
  const mode = productIndex % 4;
  if (mode === 0) {
    return FOOD_OPTION_PRESETS;
  }
  if (mode === 1) {
    return [
      { spicy: "not-spicy", greens: "without-greens", priceDelta: 0 },
      { spicy: "spicy", greens: "without-greens", priceDelta: 0.7 },
    ];
  }
  if (mode === 2) {
    return [
      { spicy: "not-spicy", greens: "without-greens", priceDelta: 0 },
      { spicy: "not-spicy", greens: "with-greens", priceDelta: 0.4 },
    ];
  }
  return [{ spicy: "not-spicy", greens: "without-greens", priceDelta: 0 }];
}

/** Per-variant-index sauce/garlic so each SKU has a unique full preference tuple. */
const FOOD_SAUCE_BY_VARIANT_INDEX = ["ketchup", "mayonnaise", "no-sauce", "ketchup"];
const FOOD_GARLIC_BY_VARIANT_INDEX = ["with-garlic", "without-garlic", "with-garlic", "without-garlic"];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seedAdmin() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    const roles = Array.isArray(existing.roles) ? existing.roles : [];
    const hasAdmin = roles.includes("admin");
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        roles: hasAdmin ? roles : [...roles, "admin"],
        passwordHash: adminPassword ? await bcrypt.hash(adminPassword, 10) : existing.passwordHash,
      },
    });
    console.log("[Seed] Admin user updated:", adminEmail);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        roles: ["admin"],
        emailVerified: true,
        locale: "en",
      },
    });
    console.log("[Seed] Admin user created:", adminEmail);
  }
}

function buildCategoryMedia(iconUrl) {
  if (!iconUrl) {
    return [];
  }
  return [{ url: iconUrl }];
}

async function unpublishLegacyCategories() {
  if (LEGACY_CATEGORY_SLUGS_TO_UNPUBLISH.length === 0) {
    return;
  }
  const legacyCategories = await prisma.category.findMany({
    where: {
      translations: {
        some: {
          slug: { in: LEGACY_CATEGORY_SLUGS_TO_UNPUBLISH },
          locale: "en",
        },
      },
    },
    select: { id: true },
  });
  if (legacyCategories.length === 0) {
    return;
  }
  await prisma.category.updateMany({
    where: { id: { in: legacyCategories.map((row) => row.id) } },
    data: { published: false },
  });
  console.log("[Seed] Legacy categories unpublished:", legacyCategories.length);
}

async function seedCategories() {
  const idsBySlug = {};

  for (let i = 0; i < FIGMA_MENU_CATEGORIES.length; i++) {
    const { slug, titles, iconUrl: remoteIconUrl, localIconOnly } = FIGMA_MENU_CATEGORIES[i];
    const iconUrl = await resolveCategoryIconUrl(slug, remoteIconUrl, {
      localIconOnly: Boolean(localIconOnly),
    });
    const media = buildCategoryMedia(iconUrl);
    const existing = await prisma.category.findFirst({
      where: { translations: { some: { slug, locale: "en" } } },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          position: i,
          published: true,
          media,
        },
      });
      idsBySlug[slug] = existing.id;
      for (const [locale, title] of Object.entries(titles)) {
        await prisma.categoryTranslation.upsert({
          where: {
            categoryId_locale: {
              categoryId: existing.id,
              locale,
            },
          },
          update: {
            title,
            slug,
            fullPath: slug,
          },
          create: {
            categoryId: existing.id,
            locale,
            title,
            slug,
            fullPath: slug,
          },
        });
      }
      continue;
    }

    const cat = await prisma.category.create({
      data: {
        position: i,
        published: true,
        media,
        translations: {
          create: Object.entries(titles).map(([locale, title]) => ({
            locale,
            title,
            slug,
            fullPath: slug,
          })),
        },
      },
    });
    idsBySlug[slug] = cat.id;
  }

  await unpublishLegacyCategories();
  console.log("[Seed] Categories:", Object.keys(idsBySlug).length);
  return idsBySlug;
}

async function seedFoodAttributes() {
  const result = await upsertFoodAttributes(prisma);
  console.log("[Seed] Food attributes prepared:", Object.keys(result));
  return result;
}

function resolveProductAttributeIds(categorySlug, foodAttributes, isFixedSingleTaste) {
  let keys = getAttributeKeysForCategorySlug(categorySlug);
  if (isFixedSingleTaste) {
    keys = keys.filter((key) => key !== "spicy" && key !== "greens");
  }
  return keys.map((key) => foodAttributes[key]?.id).filter(Boolean);
}

async function resolveSharedProductMedia() {
  const productsForImage = await prisma.product.findMany({
    select: { media: true },
    take: 100,
  });
  const existingImageEntry = productsForImage
    .map((item) => (Array.isArray(item.media) ? item.media[0] : null))
    .find((entry) => {
      if (!entry) return false;
      if (typeof entry === "string") return entry.trim().length > 0;
      if (typeof entry === "object" && !Array.isArray(entry)) {
        return Boolean(entry.url || entry.src || entry.value);
      }
      return false;
    });
  return existingImageEntry ? [existingImageEntry] : [{ url: "/images/default-product.png" }];
}

function buildVariantRows(productIndex, basePrice, stock, foodAttributes) {
  const spicyAttributeId = foodAttributes.spicy.id;
  const greensAttributeId = foodAttributes.greens.id;
  const sauceAttributeId = foodAttributes.sauce.id;
  const garlicAttributeId = foodAttributes.garlic.id;
  const presetRows = getFoodVariantPresets(productIndex);

  return presetRows.map((preset, variantIndex) => {
    const spicyValueId = foodAttributes.spicy.valueIds[preset.spicy];
    const greensValueId = foodAttributes.greens.valueIds[preset.greens];
    const sauceKey = FOOD_SAUCE_BY_VARIANT_INDEX[variantIndex % FOOD_SAUCE_BY_VARIANT_INDEX.length];
    const garlicKey = FOOD_GARLIC_BY_VARIANT_INDEX[variantIndex % FOOD_GARLIC_BY_VARIANT_INDEX.length];
    const sauceValueId = foodAttributes.sauce.valueIds[sauceKey];
    const garlicValueId = foodAttributes.garlic.valueIds[garlicKey];
    const variantPrice = Number((basePrice + preset.priceDelta).toFixed(2));
    const compareAtPrice = Number((variantPrice * 1.18).toFixed(2));

    return {
      sku: `FOOD-${1000 + productIndex}-${variantIndex + 1}`,
      price: variantPrice,
      compareAtPrice,
      stock: Math.max(0, stock - variantIndex * 2),
      position: variantIndex,
      published: true,
      attributes: {
        spicy: [{ valueId: spicyValueId, value: preset.spicy, attributeKey: "spicy" }],
        greens: [{ valueId: greensValueId, value: preset.greens, attributeKey: "greens" }],
        sauce: [{ valueId: sauceValueId, value: sauceKey, attributeKey: "sauce" }],
        garlic: [{ valueId: garlicValueId, value: garlicKey, attributeKey: "garlic" }],
      },
      options: {
        create: [
          { valueId: spicyValueId },
          { valueId: greensValueId },
          { valueId: sauceValueId },
          { valueId: garlicValueId },
        ],
      },
      attributeIds: {
        spicy: spicyAttributeId,
        greens: greensAttributeId,
        sauce: sauceAttributeId,
        garlic: garlicAttributeId,
      },
      isFixedSingleTaste: presetRows.length === 1,
    };
  });
}

async function seedProducts(categoryIdsBySlug, foodAttributes) {
  const sharedMedia = await resolveSharedProductMedia();
  const totalProducts =
    FIGMA_MENU_CATEGORIES.length * PRODUCTS_PER_CATEGORY;
  const priceStep =
    totalProducts > 1 ? (END_PRICE - START_PRICE) / (totalProducts - 1) : 0;

  await prisma.product.deleteMany({
    where: {
      OR: [
        { translations: { some: { slug: { startsWith: "seed-" } } } },
        { translations: { some: { title: { startsWith: "Product " } } } },
      ],
    },
  });

  const created = [];
  let productIndex = 0;

  console.log(
    `[Seed] Creating ${PRODUCTS_PER_CATEGORY} products for each of ${FIGMA_MENU_CATEGORIES.length} Figma categories`
  );

  for (const category of FIGMA_MENU_CATEGORIES) {
    const primaryCategoryId = categoryIdsBySlug[category.slug];
    if (!primaryCategoryId) {
      console.warn(`[Seed] Missing category id for slug: ${category.slug}`);
      continue;
    }

    const productTitles = buildProductsForCategory(category.slug, category.titles.en);

    for (let itemIndex = 0; itemIndex < productTitles.length; itemIndex++) {
      const title = productTitles[itemIndex];
      const slug = `seed-${category.slug}-${slugify(title)}-${itemIndex + 1}`;
      const basePrice = Number((START_PRICE + priceStep * productIndex).toFixed(2));
      const stock = STOCK_BASE + (productIndex % 27);
      const featured = productIndex < 12;
      const variantRows = buildVariantRows(productIndex, basePrice, stock, foodAttributes);
      const isFixedSingleTaste = variantRows[0]?.isFixedSingleTaste ?? false;
      const productAttributeIds = resolveProductAttributeIds(
        category.slug,
        foodAttributes,
        isFixedSingleTaste,
      );

      const product = await prisma.product.create({
        data: {
          media: sharedMedia,
          published: true,
          featured,
          publishedAt: new Date(),
          categoryIds: [primaryCategoryId],
          primaryCategoryId,
          attributeIds: productAttributeIds,
          categories: { connect: [{ id: primaryCategoryId }] },
          translations: {
            create: [
              {
                locale: "en",
                title,
                slug,
                subtitle: `${category.titles.en} — ${title}`,
                descriptionHtml: isFixedSingleTaste
                  ? `<p>${title} — fixed recipe.</p>`
                  : `<p>${title} with customizable spicy level and greens preference.</p>`,
              },
              {
                locale: "hy",
                title,
                slug: `${slug}-hy`,
                subtitle: category.titles.hy,
                descriptionHtml: `<p>${category.titles.hy} — ${title}</p>`,
              },
              {
                locale: "ru",
                title,
                slug: `${slug}-ru`,
                subtitle: category.titles.ru,
                descriptionHtml: `<p>${category.titles.ru} — ${title}</p>`,
              },
            ],
          },
          ...(productAttributeIds.length > 0
            ? {
                productAttributes: {
                  create: productAttributeIds.map((attributeId) => ({ attributeId })),
                },
              }
            : {}),
          variants: {
            create: variantRows.map((row) => {
              const { attributeIds, isFixedSingleTaste, ...variant } = row;
              void attributeIds;
              void isFixedSingleTaste;
              return variant;
            }),
          },
        },
      });

      created.push(product.id);
      productIndex += 1;
    }
  }

  console.log("[Seed] Products created:", created.length);
  return created;
}

async function main() {
  console.log("=== Seed start ===");
  try {
    await seedAdmin();
    const categoryIds = await seedCategories();
    const foodAttributes = await seedFoodAttributes();
    await seedProducts(categoryIds, foodAttributes);
    console.log("=== Seed done ===");
  } catch (e) {
    console.error("Seed error:", e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

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

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    slug: "shawarma",
    titles: { en: "Shawarma", hy: "Շաուրմա", ru: "Шаурма" },
  },
  {
    slug: "burger",
    titles: { en: "Burger", hy: "Բուրգեր", ru: "Бургер" },
  },
  {
    slug: "kebab",
    titles: { en: "Kebab", hy: "Քեբաբ", ru: "Кебаб" },
  },
  {
    slug: "wraps",
    titles: { en: "Wraps", hy: "Ռոլլեր", ru: "Роллы" },
  },
  {
    slug: "plates",
    titles: { en: "Plates", hy: "Ափսեներ", ru: "Тарелки" },
  },
  {
    slug: "snacks",
    titles: { en: "Snacks", hy: "Խորտիկներ", ru: "Закуски" },
  },
  {
    slug: "sandwiches",
    titles: { en: "Sandwiches", hy: "Սենդվիչներ", ru: "Сэндвичи" },
  },
  {
    slug: "pasta",
    titles: { en: "Pasta", hy: "Պաստա", ru: "Паста" },
  },
  {
    slug: "combo",
    titles: { en: "Combo", hy: "Կոմբո", ru: "Комбо" },
  },
];

const BRANDS = [
  { slug: "acme", name: "Acme" },
  { slug: "brand-x", name: "Brand X" },
  { slug: "prime", name: "Prime" },
];

const FOOD_PRODUCTS = [
  "Classic Shawarma",
  "Spicy Chicken Shawarma",
  "Beef Shawarma Plate",
  "Chicken Wrap Deluxe",
  "Falafel Wrap",
  "Mixed Grill Plate",
  "Beef Burger",
  "Chicken Burger",
  "Double Cheese Burger",
  "Spicy Crispy Chicken Burger",
  "Doner Kebab",
  "Adana Kebab",
  "Lahmacun",
  "Pita Sandwich",
  "Caesar Wrap",
  "Greek Wrap",
  "Chicken Nuggets Box",
  "French Fries Box",
  "Loaded Fries",
  "Rice Bowl Chicken",
  "Rice Bowl Beef",
  "Pilaf with Chicken",
  "Pilaf with Beef",
  "BBQ Wings",
  "Spicy Wings",
  "Chicken Tenders",
  "Beef Quesadilla",
  "Chicken Quesadilla",
  "Mexican Burrito",
  "Veggie Burrito",
  "Hot Dog Classic",
  "Cheese Hot Dog",
  "Spicy Hot Dog",
  "Club Sandwich",
  "Tuna Sandwich",
  "Chicken Panini",
  "Beef Panini",
  "Pasta Alfredo Chicken",
  "Pasta Bolognese",
  "Family Combo Box",
];

const FOOD_OPTION_PRESETS = [
  { spicy: "not-spicy", greens: "without-greens", priceDelta: 0 },
  { spicy: "not-spicy", greens: "with-greens", priceDelta: 0.4 },
  { spicy: "spicy", greens: "without-greens", priceDelta: 0.7 },
  { spicy: "spicy", greens: "with-greens", priceDelta: 1.1 },
];

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

async function seedCategories() {
  const idsBySlug = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const { slug, titles } = CATEGORIES[i];
    const existing = await prisma.category.findFirst({
      where: { translations: { some: { slug, locale: "en" } } },
    });
    if (existing) {
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
        media: [],
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
  console.log("[Seed] Categories:", Object.keys(idsBySlug).length);
  return idsBySlug;
}

async function seedBrands() {
  const ids = [];
  for (const { slug, name } of BRANDS) {
    let brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          slug,
          published: true,
          translations: {
            create: { locale: "en", name },
          },
        },
      });
    }
    ids.push(brand.id);
  }
  console.log("[Seed] Brands:", ids.length);
  return ids;
}

async function seedFoodAttributes() {
  const attributeConfigs = [
    {
      key: "spicy",
      names: {
        en: "Spicy level",
        hy: "Կծվության մակարդակ",
        ru: "Уровень остроты",
      },
      values: [
        {
          value: "spicy",
          labels: { en: "Spicy", hy: "Կծու", ru: "Острое" },
        },
        {
          value: "not-spicy",
          labels: { en: "Not spicy", hy: "Չկծու", ru: "Не острое" },
        },
      ],
    },
    {
      key: "greens",
      names: {
        en: "Greens",
        hy: "Կանաչի",
        ru: "Зелень",
      },
      values: [
        {
          value: "with-greens",
          labels: { en: "With greens", hy: "Կանաչիով", ru: "С зеленью" },
        },
        {
          value: "without-greens",
          labels: { en: "Without greens", hy: "Առանց կանաչի", ru: "Без зелени" },
        },
      ],
    },
  ];

  const result = {};

  for (let attributeIndex = 0; attributeIndex < attributeConfigs.length; attributeIndex++) {
    const config = attributeConfigs[attributeIndex];
    let attribute = await prisma.attribute.findUnique({
      where: { key: config.key },
    });

    if (!attribute) {
      attribute = await prisma.attribute.create({
        data: {
          key: config.key,
          type: "select",
          filterable: true,
          position: attributeIndex + 10,
        },
      });
    }

    for (const [locale, name] of Object.entries(config.names)) {
      await prisma.attributeTranslation.upsert({
        where: {
          attributeId_locale: {
            attributeId: attribute.id,
            locale,
          },
        },
        update: { name },
        create: {
          attributeId: attribute.id,
          locale,
          name,
        },
      });
    }

    const valueIds = {};
    for (let valueIndex = 0; valueIndex < config.values.length; valueIndex++) {
      const valueConfig = config.values[valueIndex];
      let attributeValue = await prisma.attributeValue.findFirst({
        where: {
          attributeId: attribute.id,
          value: valueConfig.value,
        },
      });

      if (!attributeValue) {
        attributeValue = await prisma.attributeValue.create({
          data: {
            attributeId: attribute.id,
            value: valueConfig.value,
            position: valueIndex,
          },
        });
      } else if (attributeValue.position !== valueIndex) {
        attributeValue = await prisma.attributeValue.update({
          where: { id: attributeValue.id },
          data: { position: valueIndex },
        });
      }

      for (const [locale, label] of Object.entries(valueConfig.labels)) {
        await prisma.attributeValueTranslation.upsert({
          where: {
            attributeValueId_locale: {
              attributeValueId: attributeValue.id,
              locale,
            },
          },
          update: { label },
          create: {
            attributeValueId: attributeValue.id,
            locale,
            label,
          },
        });
      }

      valueIds[valueConfig.value] = attributeValue.id;
    }

    result[config.key] = {
      id: attribute.id,
      valueIds,
    };
  }

  console.log("[Seed] Food attributes prepared:", Object.keys(result));
  return result;
}

async function seedProducts(categoryIdsBySlug, brandIds, foodAttributes) {
  const titles = FOOD_PRODUCTS;
  const START_PRICE = 8;
  const END_PRICE = 22;
  const PRICE_STEP = titles.length > 1 ? (END_PRICE - START_PRICE) / (titles.length - 1) : 0;
  const STOCK_BASE = 24;
  const comboCategoryId = categoryIdsBySlug.combo;
  const menuCategoryIds = Object.entries(categoryIdsBySlug)
    .filter(([slug]) => slug !== "combo")
    .map(([, id]) => id);

  // Reuse the currently existing product image so all new products share it.
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
  const sharedMedia = existingImageEntry ? [existingImageEntry] : [];

  // Remove old incorrect seeded products before creating the new catalog.
  await prisma.product.deleteMany({
    where: {
      OR: [
        { translations: { some: { slug: { startsWith: "seed-" } } } },
        { translations: { some: { title: { startsWith: "Product " } } } },
      ],
    },
  });

  const created = [];
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i] || `Product ${i + 1}`;
    const slug = `seed-food-${slugify(title)}-${i + 1}`;
    const isComboProduct = title.toLowerCase().includes("combo");
    const catIndex = i % menuCategoryIds.length;
    const primaryCategoryId = isComboProduct ? comboCategoryId : menuCategoryIds[catIndex];
    const categoryIdsList = [primaryCategoryId];
    const brandId = i % 3 === 0 ? brandIds[i % brandIds.length] : null;
    const basePrice = Number((START_PRICE + PRICE_STEP * i).toFixed(2));
    const stock = STOCK_BASE + (i % 27);
    const featured = i < 8;
    const spicyAttributeId = foodAttributes.spicy.id;
    const greensAttributeId = foodAttributes.greens.id;

    const variantRows = FOOD_OPTION_PRESETS.map((preset, variantIndex) => {
      const spicyValueId = foodAttributes.spicy.valueIds[preset.spicy];
      const greensValueId = foodAttributes.greens.valueIds[preset.greens];
      const variantPrice = Number((basePrice + preset.priceDelta).toFixed(2));
      const compareAtPrice = Number((variantPrice * 1.18).toFixed(2));

      return {
        sku: `FOOD-${1000 + i}-${variantIndex + 1}`,
        price: variantPrice,
        compareAtPrice,
        stock: Math.max(0, stock - variantIndex * 2),
        position: variantIndex,
        published: true,
        attributes: {
          spicy: [{ valueId: spicyValueId, value: preset.spicy, attributeKey: "spicy" }],
          greens: [{ valueId: greensValueId, value: preset.greens, attributeKey: "greens" }],
        },
        options: {
          create: [{ valueId: spicyValueId }, { valueId: greensValueId }],
        },
      };
    });

    const product = await prisma.product.create({
      data: {
        brandId,
        media: sharedMedia,
        published: true,
        featured,
        publishedAt: new Date(),
        categoryIds: categoryIdsList,
        primaryCategoryId,
        attributeIds: [spicyAttributeId, greensAttributeId],
        categories: { connect: categoryIdsList.map((id) => ({ id })) },
        translations: {
          create: {
            locale: "en",
            title,
            slug,
            subtitle: `Freshly prepared ${title.toLowerCase()}`,
            descriptionHtml: `<p>${title} with customizable spicy level and greens preference.</p>`,
          },
        },
        productAttributes: {
          create: [{ attributeId: spicyAttributeId }, { attributeId: greensAttributeId }],
        },
        variants: { create: variantRows },
      },
    });
    created.push(product.id);
  }
  console.log("[Seed] Products created:", created.length);
  return created;
}

async function main() {
  console.log("=== Seed start ===");
  try {
    await seedAdmin();
    const categoryIds = await seedCategories();
    const brandIds = await seedBrands();
    const foodAttributes = await seedFoodAttributes();
    await seedProducts(categoryIds, brandIds, foodAttributes);
    console.log("=== Seed done ===");
  } catch (e) {
    console.error("Seed error:", e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

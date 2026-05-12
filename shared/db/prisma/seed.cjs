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
  { slug: "electronics", title: "Electronics" },
  { slug: "clothing", title: "Clothing" },
  { slug: "shoes", title: "Shoes" },
  { slug: "home", title: "Home & Garden" },
  { slug: "sports", title: "Sports" },
  { slug: "books", title: "Books" },
  { slug: "accessories", title: "Accessories" },
];

const BRANDS = [
  { slug: "acme", name: "Acme" },
  { slug: "brand-x", name: "Brand X" },
  { slug: "prime", name: "Prime" },
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
  const ids = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    const { slug, title } = CATEGORIES[i];
    const existing = await prisma.category.findFirst({
      where: { translations: { some: { slug, locale: "en" } } },
    });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const cat = await prisma.category.create({
      data: {
        position: i,
        published: true,
        media: [],
        translations: {
          create: {
            locale: "en",
            title,
            slug,
            fullPath: slug,
          },
        },
      },
    });
    ids.push(cat.id);
  }
  console.log("[Seed] Categories:", ids.length);
  return ids;
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

async function seedProducts(categoryIds, brandIds) {
  const titles = [
    "Apple iPhone 15 128GB",
    "Samsung Galaxy A55 5G 128GB",
    "Xiaomi Redmi Note 13 256GB",
    "Apple AirPods Pro 2",
    "Sony WH-1000XM5 Headphones",
    "Logitech MX Master 3S Mouse",
    "Dell 27-inch QHD Monitor",
    "HP LaserJet Pro Printer",
    "Lenovo IdeaPad Slim 5 Laptop",
    "Canon EOS R50 Mirrorless Camera",
    "Nike Air Zoom Pegasus 40",
    "Adidas Ultraboost Light",
    "Puma Essentials Hoodie",
    "Levi's 501 Original Jeans",
    "New Balance 574 Sneakers",
    "Under Armour Training T-Shirt",
    "KitchenAid Artisan Stand Mixer",
    "Tefal Non-Stick Frying Pan 28cm",
    "Philips Air Fryer XXL",
    "Bosch Cordless Vacuum Cleaner",
    "IKEA MALM Bedside Table",
    "Dyson Cool Tower Fan",
    "Xiaomi Mi Smart Kettle Pro",
    "Panasonic Microwave Oven 23L",
    "Decathlon Yoga Mat 8mm",
    "Wilson US Open Tennis Racket",
    "Spalding Basketball Size 7",
    "Reebok Adjustable Dumbbell 10kg",
    "Garmin Forerunner 255",
    "Hydro Flask 32oz Water Bottle",
    "The Psychology of Money",
    "Atomic Habits",
    "The Lean Startup",
    "Deep Work",
    "Sapiens: A Brief History of Humankind",
    "Anker 65W USB-C Charger",
    "Belkin MagSafe Power Bank 10000mAh",
    "UGREEN USB-C Hub 7-in-1",
    "Samsonite Travel Backpack 25L",
    "Fjallraven Kanken Classic Bag",
  ];
  // Product prices are stored in USD and converted to AMD in UI.
  // Keep displayed AMD range between 5000 and 25000.
  const AMD_PER_USD = 400;
  const MIN_DISPLAY_PRICE_AMD = 5000;
  const MAX_DISPLAY_PRICE_AMD = 25000;
  const START_PRICE = MIN_DISPLAY_PRICE_AMD / AMD_PER_USD; // 12.5 USD
  const END_PRICE = MAX_DISPLAY_PRICE_AMD / AMD_PER_USD; // 62.5 USD
  const PRICE_STEP = titles.length > 1 ? (END_PRICE - START_PRICE) / (titles.length - 1) : 0;
  const STOCK_BASE = 15;

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
    const slug = `seed-${slugify(title)}-${i + 1}`;
    const catIndex = i % categoryIds.length;
    const primaryCategoryId = categoryIds[catIndex];
    const categoryIdsList = [primaryCategoryId];
    const brandId = i % 3 === 0 ? brandIds[i % brandIds.length] : null;
    const price = Number((START_PRICE + PRICE_STEP * i).toFixed(2));
    const stock = STOCK_BASE + (i % 61);
    const featured = i < 8;
    const compareAtPrice = Number((price * 1.2).toFixed(2));
    const product = await prisma.product.create({
      data: {
        brandId,
        media: sharedMedia,
        published: true,
        featured,
        publishedAt: new Date(),
        categoryIds: categoryIdsList,
        primaryCategoryId,
        attributeIds: [],
        categories: { connect: categoryIdsList.map((id) => ({ id })) },
        translations: {
          create: {
            locale: "en",
            title,
            slug,
            subtitle: `Quality ${title.toLowerCase()}`,
            descriptionHtml: `<p>Great product for everyday use. Item #${i + 1}.</p>`,
          },
        },
        variants: {
          create: {
            price,
            compareAtPrice,
            stock,
            sku: `SKU-${1000 + i}`,
            position: 0,
            published: true,
          },
        },
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
    await seedProducts(categoryIds, brandIds);
    console.log("=== Seed done ===");
  } catch (e) {
    console.error("Seed error:", e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

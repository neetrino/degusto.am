const path = require("path");
const fs = require("fs");

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
const { getAttributeKeysForCategorySlug } = require("./data/food-attributes.cjs");
const { upsertFoodAttributes } = require("./lib/upsert-food-attributes.cjs");

const prisma = new PrismaClient();

async function buildCategorySlugById() {
  const rows = await prisma.categoryTranslation.findMany({
    where: { locale: "en" },
    select: { categoryId: true, slug: true },
  });
  const map = new Map();
  for (const row of rows) {
    map.set(row.categoryId, row.slug);
  }
  return map;
}

async function linkAttributesToProduct(productId, attributeIds) {
  const uniqueIds = [...new Set(attributeIds)];
  await prisma.productAttribute.deleteMany({ where: { productId } });
  if (uniqueIds.length > 0) {
    await prisma.productAttribute.createMany({
      data: uniqueIds.map((attributeId) => ({ productId, attributeId })),
      skipDuplicates: true,
    });
  }
  await prisma.product.update({
    where: { id: productId },
    data: { attributeIds: uniqueIds },
  });
}

async function main() {
  console.log("=== Backfill product attributes start ===");
  try {
    const foodAttributes = await upsertFoodAttributes(prisma);
    console.log("[Backfill] Attributes upserted:", Object.keys(foodAttributes).length);

    const categorySlugById = await buildCategorySlugById();
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      select: { id: true, primaryCategoryId: true },
    });

    let updated = 0;
    for (const product of products) {
      const categorySlug = product.primaryCategoryId
        ? categorySlugById.get(product.primaryCategoryId)
        : undefined;
      const keys = getAttributeKeysForCategorySlug(categorySlug);
      const attributeIds = keys
        .map((key) => foodAttributes[key]?.id)
        .filter(Boolean);

      await linkAttributesToProduct(product.id, attributeIds);
      updated += 1;
    }

    console.log("[Backfill] Products updated:", updated);
    console.log("=== Backfill product attributes done ===");
  } catch (error) {
    console.error("Backfill error:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

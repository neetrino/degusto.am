/**
 * Seed Figma menu categories + 18 products each into Neon (DATABASE_URL).
 * Run: pnpm db:seed:catalog
 */
import path from "node:path";

import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { isNotNull, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/db/schema";
import { figmaCatalogCategories } from "@/db/seed/figma-catalog-data";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

/** Deterministic UUIDs in a range that does not collide with legacy seed IDs. */
function seedUuid(bucket: number, index: number): string {
  const n = BigInt(bucket) * 1_000_000n + BigInt(index);
  return `01900000-0000-7000-9000-${n.toString(16).padStart(12, "0")}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function priceFor(categorySort: number, productIndex: number): number {
  const base = 800 + categorySort * 40;
  return base + productIndex * 50;
}

async function clearCatalog(
  db: ReturnType<typeof drizzle<typeof schema>>,
): Promise<void> {
  await db.delete(schema.productCategories);
  await db
    .delete(schema.mediaAssets)
    .where(
      or(
        isNotNull(schema.mediaAssets.productId),
        isNotNull(schema.mediaAssets.categoryId),
      ),
    );
  await db.delete(schema.products);
  await db.delete(schema.categories);
}

async function seedFigmaCatalog(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const db = drizzle(neon(databaseUrl), { schema });
  const now = new Date();

  console.log("Clearing existing catalog rows...");
  await clearCatalog(db);

  let productCount = 0;

  for (const [categoryIndex, category] of figmaCatalogCategories.entries()) {
    const categoryId = seedUuid(1, categoryIndex + 1);
    const categoryMediaId = seedUuid(2, categoryIndex + 1);

    await db
      .insert(schema.categories)
      .values({
        id: categoryId,
        translations: category.translations,
        sortOrder: category.sortOrder,
        status: "ACTIVE",
      })
      .onConflictDoUpdate({
        target: schema.categories.id,
        set: {
          translations: category.translations,
          sortOrder: category.sortOrder,
          status: "ACTIVE",
          deletedAt: null,
          updatedAt: now,
        },
      });

    await db
      .insert(schema.mediaAssets)
      .values({
        id: categoryMediaId,
        objectKey: category.iconKey,
        mimeType: "image/webp",
        byteSize: 20_000,
        uploadStatus: "READY",
        role: "PRIMARY",
        sortOrder: 0,
        isPrimary: true,
        categoryId,
        altTranslations: {
          hy: category.translations.hy?.title ?? category.key,
          en: category.translations.en?.title ?? category.key,
          ru: category.translations.ru?.title ?? category.key,
        },
      })
      .onConflictDoUpdate({
        target: schema.mediaAssets.id,
        set: {
          objectKey: category.iconKey,
          uploadStatus: "READY",
          role: "PRIMARY",
          isPrimary: true,
          categoryId,
          updatedAt: now,
        },
      });

    for (const [productIndex, titles] of category.productTitles.entries()) {
      const flatIndex = categoryIndex * 100 + productIndex + 1;
      const productId = seedUuid(3, flatIndex);
      const productCategoryId = seedUuid(4, flatIndex);
      const enSlugBase = slugify(titles.en) || `item-${flatIndex}`;
      const slug = `${category.key}-${enSlugBase}`;
      const sku = `DG-${category.key.slice(0, 8).toUpperCase()}-${String(productIndex + 1).padStart(3, "0")}`;
      const priceAmount = priceFor(category.sortOrder, productIndex);

      const translations = {
        hy: {
          title: titles.hy,
          slug: `${slug}-hy`,
          description: titles.hy,
        },
        en: {
          title: titles.en,
          slug,
          description: titles.en,
        },
        ru: {
          title: titles.ru,
          slug: `${slug}-ru`,
          description: titles.ru,
        },
      };

      await db
        .insert(schema.products)
        .values({
          id: productId,
          sku,
          translations,
          priceAmount,
          compareAtAmount: Math.round(priceAmount * 1.25),
          stockOnHand: 50,
          lowStockThreshold: 5,
          status: "ACTIVE",
          isFeatured: productIndex < 3,
        })
        .onConflictDoUpdate({
          target: schema.products.id,
          set: {
            sku,
            translations,
            priceAmount,
            compareAtAmount: Math.round(priceAmount * 1.25),
            stockOnHand: 50,
            status: "ACTIVE",
            isFeatured: productIndex < 3,
            deletedAt: null,
            updatedAt: now,
          },
        });

      await db
        .insert(schema.productCategories)
        .values({
          id: productCategoryId,
          productId,
          categoryId,
          isPrimary: true,
          sortOrder: productIndex + 1,
        })
        .onConflictDoNothing({ target: schema.productCategories.id });

      productCount += 1;
    }
  }

  console.log(
    `Seeded ${figmaCatalogCategories.length} categories and ${productCount} products into Neon.`,
  );
}

seedFigmaCatalog().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

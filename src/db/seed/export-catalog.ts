/**
 * Export storefront catalog tables from DATABASE_URL (.env) into
 * `src/db/seed/snapshots/catalog-from-db.json`.
 *
 * Does not export users/sessions/passwords.
 */
import { config } from "dotenv";
config({ path: ".env" });

import { mkdirSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing in .env");
  }

  const host = new URL(databaseUrl.replace(/^postgresql:/, "https:")).host;
  const sql = neon(databaseUrl);

  const [
    products,
    categories,
    productCategories,
    media,
    hero,
    blog,
    settings,
    promotions,
    delivery,
  ] = await Promise.all([
    sql`SELECT * FROM products ORDER BY created_at`,
    sql`SELECT * FROM categories ORDER BY sort_order`,
    sql`SELECT * FROM product_categories`,
    sql`SELECT id, product_id, category_id, role, upload_status, is_primary, object_key, mime_type, byte_size, width, height, sort_order, created_at FROM media_assets ORDER BY created_at`,
    sql`SELECT * FROM hero_slides ORDER BY sort_order`,
    sql`SELECT id, status, translations, published_at, created_at FROM blog_posts`,
    sql`SELECT key, value FROM store_settings ORDER BY key`,
    sql`SELECT id, kind, code, product_id, category_id, discount_type, discount_value, is_active, priority FROM promotions`,
    sql`SELECT * FROM delivery_rules`,
  ]);

  const dump = {
    exportedAt: new Date().toISOString(),
    sourceHost: host,
    counts: {
      products: products.length,
      categories: categories.length,
      productCategories: productCategories.length,
      media: media.length,
      heroSlides: hero.length,
      blogPosts: blog.length,
      storeSettings: settings.length,
      promotions: promotions.length,
      deliveryRules: delivery.length,
    },
    products,
    categories,
    productCategories,
    media,
    heroSlides: hero,
    blogPosts: blog,
    storeSettings: settings,
    promotions,
    deliveryRules: delivery,
  };

  mkdirSync("src/db/seed/snapshots", { recursive: true });
  writeFileSync(
    "src/db/seed/snapshots/catalog-from-db.json",
    `${JSON.stringify(dump, null, 2)}\n`,
    "utf8",
  );

  console.log(JSON.stringify({ sourceHost: host, counts: dump.counts }, null, 2));
  console.log("wrote src/db/seed/snapshots/catalog-from-db.json");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

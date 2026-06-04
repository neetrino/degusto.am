-- Drop product brand association and brand catalog tables
ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_brandId_fkey";
DROP INDEX IF EXISTS "products_brandId_idx";
ALTER TABLE "products" DROP COLUMN IF EXISTS "brandId";

DROP TABLE IF EXISTS "brand_translations";
DROP TABLE IF EXISTS "brands";

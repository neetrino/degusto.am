-- Speeds up admin category filtering on products.categoryIds (text[] has/hasSome).
CREATE INDEX IF NOT EXISTS "products_categoryIds_gin_idx"
ON "products"
USING GIN ("categoryIds");

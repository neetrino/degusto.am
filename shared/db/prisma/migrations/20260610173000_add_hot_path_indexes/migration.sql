-- Hot-path indexes for storefront/admin filters and joins
CREATE INDEX IF NOT EXISTS "products_primaryCategoryId_idx" ON "products"("primaryCategoryId");
CREATE INDEX IF NOT EXISTS "products_updatedAt_idx" ON "products"("updatedAt" DESC);
CREATE INDEX IF NOT EXISTS "products_discountPercent_idx" ON "products"("discountPercent");

CREATE INDEX IF NOT EXISTS "product_variants_published_price_idx" ON "product_variants"("published", "price");
CREATE INDEX IF NOT EXISTS "product_variants_published_stock_idx" ON "product_variants"("published", "stock");

CREATE INDEX IF NOT EXISTS "attribute_values_attributeId_idx" ON "attribute_values"("attributeId");
CREATE INDEX IF NOT EXISTS "product_variant_options_variantId_idx" ON "product_variant_options"("variantId");

-- Many-to-many helper index for category/product joins (inverse side).
CREATE INDEX IF NOT EXISTS "_ProductCategories_A_idx" ON "_ProductCategories"("A");

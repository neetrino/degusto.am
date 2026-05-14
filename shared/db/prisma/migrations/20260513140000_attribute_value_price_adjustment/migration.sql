-- Optional price delta when this attribute value is chosen (e.g. extra spicy fee).
ALTER TABLE "attribute_values" ADD COLUMN "priceAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0;

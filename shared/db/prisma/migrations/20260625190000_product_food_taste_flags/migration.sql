-- Move spicy/greens from attributes to product-level flags.

ALTER TABLE "products"
  ADD COLUMN "supportsSpicy" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "supportsGreens" BOOLEAN NOT NULL DEFAULT false;

-- Backfill from variant options (products that offered both choices).
UPDATE "products" p
SET "supportsSpicy" = true
WHERE EXISTS (
  SELECT 1
  FROM "product_variants" pv
  INNER JOIN "product_variant_options" pvo ON pvo."variantId" = pv.id
  INNER JOIN "attribute_values" av ON av.id = pvo."valueId"
  INNER JOIN "attributes" a ON a.id = av."attributeId" AND a.key = 'spicy'
  WHERE pv."productId" = p.id
    AND pv.published = true
    AND av.value = 'spicy'
)
AND EXISTS (
  SELECT 1
  FROM "product_variants" pv
  INNER JOIN "product_variant_options" pvo ON pvo."variantId" = pv.id
  INNER JOIN "attribute_values" av ON av.id = pvo."valueId"
  INNER JOIN "attributes" a ON a.id = av."attributeId" AND a.key = 'spicy'
  WHERE pv."productId" = p.id
    AND pv.published = true
    AND av.value = 'not-spicy'
);

UPDATE "products" p
SET "supportsGreens" = true
WHERE EXISTS (
  SELECT 1
  FROM "product_variants" pv
  INNER JOIN "product_variant_options" pvo ON pvo."variantId" = pv.id
  INNER JOIN "attribute_values" av ON av.id = pvo."valueId"
  INNER JOIN "attributes" a ON a.id = av."attributeId" AND a.key = 'greens'
  WHERE pv."productId" = p.id
    AND pv.published = true
    AND av.value = 'with-greens'
)
AND EXISTS (
  SELECT 1
  FROM "product_variants" pv
  INNER JOIN "product_variant_options" pvo ON pvo."variantId" = pv.id
  INNER JOIN "attribute_values" av ON av.id = pvo."valueId"
  INNER JOIN "attributes" a ON a.id = av."attributeId" AND a.key = 'greens'
  WHERE pv."productId" = p.id
    AND pv.published = true
    AND av.value = 'without-greens'
);

-- Remove spicy/greens from variant JSON attributes.
UPDATE "product_variants"
SET "attributes" = "attributes" - 'spicy' - 'greens'
WHERE "attributes" IS NOT NULL
  AND ("attributes" ? 'spicy' OR "attributes" ? 'greens');

-- Drop variant options linked to spicy/greens attribute values.
DELETE FROM "product_variant_options" pvo
USING "attribute_values" av, "attributes" a
WHERE pvo."valueId" = av.id
  AND av."attributeId" = a.id
  AND a.key IN ('spicy', 'greens');

-- Unlink products from spicy/greens attributes.
DELETE FROM "product_attributes" pa
USING "attributes" a
WHERE pa."attributeId" = a.id
  AND a.key IN ('spicy', 'greens');

UPDATE "products" p
SET "attributeIds" = COALESCE(
  (
    SELECT array_agg(elem)
    FROM unnest(p."attributeIds") AS elem
    WHERE elem NOT IN (SELECT id::text FROM "attributes" WHERE key IN ('spicy', 'greens'))
  ),
  '{}'
)
WHERE EXISTS (
  SELECT 1 FROM "attributes" a
  WHERE a.key IN ('spicy', 'greens')
    AND a.id::text = ANY (p."attributeIds")
);

-- Remove spicy/greens attribute values and attributes.
DELETE FROM "attribute_value_translations" avt
USING "attribute_values" av, "attributes" a
WHERE avt."attributeValueId" = av.id
  AND av."attributeId" = a.id
  AND a.key IN ('spicy', 'greens');

DELETE FROM "attribute_values" av
USING "attributes" a
WHERE av."attributeId" = a.id
  AND a.key IN ('spicy', 'greens');

DELETE FROM "attribute_translations" at
USING "attributes" a
WHERE at."attributeId" = a.id
  AND a.key IN ('spicy', 'greens');

DELETE FROM "attributes"
WHERE key IN ('spicy', 'greens');

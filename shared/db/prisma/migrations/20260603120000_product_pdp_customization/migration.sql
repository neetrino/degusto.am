-- Per-product PDP customization: which attribute values are default (Exclude) vs paid add-ons (Add).
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "pdpCustomization" JSONB;

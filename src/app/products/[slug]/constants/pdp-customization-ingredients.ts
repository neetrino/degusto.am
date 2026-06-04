/** Product attribute keys whose values appear in Add / Exclude pills on PDP. */
export const PDP_CUSTOMIZATION_INGREDIENT_ATTR_KEYS = [
  'ingredient',
  'ingredients',
  'component',
  'components',
  'topping',
  'toppings',
  'sauce',
  'garlic',
] as const;

/** Variant default slugs — not offered as Add / Exclude choices. */
export const PDP_CUSTOMIZATION_EXCLUDED_VALUE_SLUGS = [
  'no-sauce',
  'without-garlic',
  'not-spicy',
  'without-greens',
] as const;

/** Base recipe keys — values typically included in the product (Exclude section). */
export const PDP_CUSTOMIZATION_DEFAULT_ATTR_KEYS = [
  'ingredient',
  'ingredients',
  'sauce',
  'garlic',
] as const;

/** Paid / optional extras (Add section) when not already classified as default. */
export const PDP_CUSTOMIZATION_OPTIONAL_ATTR_KEYS = [
  'topping',
  'toppings',
  'component',
  'components',
] as const;

export type PdpCustomizationIngredientAttrKey =
  (typeof PDP_CUSTOMIZATION_INGREDIENT_ATTR_KEYS)[number];

export function isPdpCustomizationAttributeKey(attrKey: string): boolean {
  return PDP_CUSTOMIZATION_INGREDIENT_ATTR_KEYS.includes(
    attrKey as PdpCustomizationIngredientAttrKey,
  );
}

/** Product attribute keys that expose selectable PDP ingredient options. */
export const PDP_CUSTOMIZATION_INGREDIENT_ATTR_KEYS = [
  'ingredient',
  'ingredients',
  'component',
  'components',
  'topping',
  'toppings',
] as const;

/** Fallback catalog when product has no ingredient attributes. */
export const PDP_DEFAULT_CUSTOMIZATION_INGREDIENT_IDS = [
  'cheese',
  'bacon',
  'egg',
  'onion',
  'tomato',
  'lettuce',
  'pickles',
  'sauce',
  'garlic',
  'greens',
  'mushroom',
  'pepper',
] as const;

export type PdpDefaultCustomizationIngredientId =
  (typeof PDP_DEFAULT_CUSTOMIZATION_INGREDIENT_IDS)[number];

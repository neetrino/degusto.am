/**
 * Column order for PDP preference attributes (food options). Unknown keys follow in alphabetical order.
 */
export const PDP_PREFERENCE_ATTR_ORDER: readonly string[] = [
  'spicy',
  'sauce',
  'greens',
  'garlic',
];

/**
 * Food prefs inside the PDP card: garlic (sox) → spicy (kcu) → greens → sauce.
 */
export const PDP_CARD_PREFERENCE_ORDER: readonly string[] = [
  'garlic',
  'spicy',
  'greens',
  'sauce',
];

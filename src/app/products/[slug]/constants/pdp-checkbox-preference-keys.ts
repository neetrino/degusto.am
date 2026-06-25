/** Food prefs rendered as a checkbox list on PDP (toggle on/off). */
export const PDP_CHECKBOX_PREFERENCE_KEYS: readonly string[] = [];

/**
 * Hidden on PDP — still resolved from variant defaults for cart/checkout.
 * Sauce / garlic use Add / Exclude pills instead.
 */
export const PDP_HIDDEN_FOOD_PREFERENCE_KEYS: readonly string[] = [
  'sauce',
  'garlic',
];

export function isPdpCheckboxPreferenceKey(attrKey: string): boolean {
  return PDP_CHECKBOX_PREFERENCE_KEYS.includes(attrKey);
}

export function isHiddenPdpFoodPreferenceKey(attrKey: string): boolean {
  return PDP_HIDDEN_FOOD_PREFERENCE_KEYS.includes(attrKey);
}

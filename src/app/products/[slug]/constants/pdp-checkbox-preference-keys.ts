/**
 * Food prefs rendered as a checkbox list on PDP (toggle on/off).
 */
export const PDP_CHECKBOX_PREFERENCE_KEYS: readonly string[] = ['sauce', 'garlic'];

/** Hidden on PDP — still resolved from variant defaults for cart/checkout. */
export const PDP_HIDDEN_FOOD_PREFERENCE_KEYS: readonly string[] = ['spicy', 'greens'];

export function isPdpCheckboxPreferenceKey(attrKey: string): boolean {
  return PDP_CHECKBOX_PREFERENCE_KEYS.includes(attrKey);
}

export function isHiddenPdpFoodPreferenceKey(attrKey: string): boolean {
  return PDP_HIDDEN_FOOD_PREFERENCE_KEYS.includes(attrKey);
}

/**
 * Food prefs rendered as a checkbox list (toggle; current choice can be cleared).
 */
export const PDP_CHECKBOX_PREFERENCE_KEYS: readonly string[] = [
  'spicy',
  'greens',
  'sauce',
  'garlic',
];

export function isPdpCheckboxPreferenceKey(attrKey: string): boolean {
  return PDP_CHECKBOX_PREFERENCE_KEYS.includes(attrKey);
}

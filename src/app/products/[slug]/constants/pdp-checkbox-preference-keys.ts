/**
 * PDP food preference keys shown in the new-format card (UI filter only; variants/data unchanged).
 * Color and size are always shown when present so variant selection still works.
 */
export const PDP_VISIBLE_PREFERENCE_KEYS: readonly string[] = [
  'spicy',
  'greens',
  'sauce',
  'garlic',
];

const PDP_VISIBLE_SET = new Set<string>(PDP_VISIBLE_PREFERENCE_KEYS);

export function isPdpShownNewFormatAttributeKey(attrKey: string): boolean {
  if (attrKey === 'color' || attrKey === 'size') return true;
  return PDP_VISIBLE_SET.has(attrKey);
}

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

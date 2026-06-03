export const CUSTOMIZATION_SELECTION_SEPARATOR = ', ';

/** Parse comma-separated customization labels stored on cart lines. */
export function parseCustomizationSelection(value: string): string[] {
  if (!value.trim()) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function isCustomizationSelected(value: string, label: string): boolean {
  return parseCustomizationSelection(value).includes(label);
}

/** Default ingredient still included (not listed under exclusions). */
export function isDefaultIngredientIncluded(exclusions: string, label: string): boolean {
  return !parseCustomizationSelection(exclusions).includes(label);
}

/** Uncheck → add to exclusions; check again → remove from exclusions. */
export function toggleDefaultIngredientIncluded(exclusions: string, label: string): string {
  const excluded = parseCustomizationSelection(exclusions);
  const next = excluded.includes(label)
    ? excluded.filter((item) => item !== label)
    : [...excluded, label];
  return next.join(CUSTOMIZATION_SELECTION_SEPARATOR);
}

export function toggleCustomizationSelection(value: string, label: string): string {
  const items = parseCustomizationSelection(value);
  const next = items.includes(label)
    ? items.filter((item) => item !== label)
    : [...items, label];
  return next.join(CUSTOMIZATION_SELECTION_SEPARATOR);
}

/** Removes labels selected in `value` from the opposite customization list. */
export function stripConflictingCustomizationLabels(
  value: string,
  selectedElsewhere: string[]
): string {
  if (selectedElsewhere.length === 0) {
    return value;
  }
  const blocked = new Set(selectedElsewhere);
  const next = parseCustomizationSelection(value).filter((item) => !blocked.has(item));
  return next.join(CUSTOMIZATION_SELECTION_SEPARATOR);
}

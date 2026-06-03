const SELECTION_SEPARATOR = ', ';

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

export function toggleCustomizationSelection(value: string, label: string): string {
  const items = parseCustomizationSelection(value);
  const next = items.includes(label)
    ? items.filter((item) => item !== label)
    : [...items, label];
  return next.join(SELECTION_SEPARATOR);
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
  return next.join(SELECTION_SEPARATOR);
}

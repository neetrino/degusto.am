import { t } from '../../../../lib/i18n';
import type { LanguageCode } from '../../../../lib/language';

export const CUSTOMIZATION_SELECTION_SEPARATOR = ', ';

const LOCALE_BY_LANGUAGE: Record<LanguageCode, string> = {
  hy: 'hy-AM',
  ru: 'ru-RU',
  en: 'en-US',
};

/** Display label for excludable ingredients (e.g. «Առանց Սոխ»). Stored values stay unprefixed. */
export function formatPdpExclusionDisplayLabel(language: LanguageCode, label: string): string {
  const prefix = t(language, 'product.customizationWithoutPrefix');
  const trimmed = label.trim();
  if (!trimmed) {
    return trimmed;
  }

  const locale = LOCALE_BY_LANGUAGE[language];
  if (trimmed.toLocaleLowerCase(locale).startsWith(prefix.toLocaleLowerCase(locale))) {
    return trimmed;
  }

  return `${prefix} ${trimmed}`;
}

export function formatPdpExclusionsDisplayList(language: LanguageCode, exclusions: string): string {
  return parseCustomizationSelection(exclusions)
    .map((label) => formatPdpExclusionDisplayLabel(language, label))
    .join(CUSTOMIZATION_SELECTION_SEPARATOR);
}

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

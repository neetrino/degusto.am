import type { LanguageCode } from '@/lib/language';

const LOCALE_FALLBACK_ORDER: LanguageCode[] = ['hy', 'en', 'ru'];

/**
 * Pick the best translation row for a locale with hy → en → ru → first available fallback.
 */
export function pickLocaleTranslation<T extends { locale: string }>(
  rows: T[] | null | undefined,
  preferredLocale: string,
): T | null {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  const preferred = rows.find((row) => row.locale === preferredLocale);
  if (preferred) {
    return preferred;
  }

  for (const locale of LOCALE_FALLBACK_ORDER) {
    const match = rows.find((row) => row.locale === locale);
    if (match) {
      return match;
    }
  }

  return rows[0] ?? null;
}

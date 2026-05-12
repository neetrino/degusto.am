const STOREFRONT_LOCALES = ["hy", "ru", "en"] as const;

export type StorefrontLocale = (typeof STOREFRONT_LOCALES)[number];

const PRIMARY_LOCALE: StorefrontLocale = "hy";

function isStorefrontLocale(value: string): value is StorefrontLocale {
  return (STOREFRONT_LOCALES as readonly string[]).includes(value);
}

export function resolveStorefrontLocale(
  value: string | null | undefined
): StorefrontLocale {
  if (!value) {
    return PRIMARY_LOCALE;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return PRIMARY_LOCALE;
  }

  return isStorefrontLocale(normalized) ? normalized : PRIMARY_LOCALE;
}

export function resolveStorefrontLocaleFromCookie(
  cookieValue: string | null | undefined
): StorefrontLocale {
  return resolveStorefrontLocale(cookieValue);
}

export function resolveStorefrontLocaleFromSearchParams(
  searchParams: URLSearchParams,
  key: string = "lang"
): StorefrontLocale {
  return resolveStorefrontLocale(searchParams.get(key));
}

export function getStorefrontLocaleFallbackChain(
  locale: StorefrontLocale
): StorefrontLocale[] {
  return Array.from(new Set<StorefrontLocale>([locale, "hy", "en"]));
}

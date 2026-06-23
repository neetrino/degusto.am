const STOREFRONT_LOCALES = ["hy", "ru", "en"] as const;

export { STOREFRONT_LOCALES };

export type StorefrontLocale = (typeof STOREFRONT_LOCALES)[number];

/** Default storefront locale for static SSR / first paint. */
export const PRIMARY_LOCALE: StorefrontLocale = "hy";

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

type PageSearchParams = Record<string, string | string[] | undefined>;

/** ISR pages: `?lang=` when present, else `PRIMARY_LOCALE` (no SSR cookies). */
export function resolveStorefrontLocaleFromPageSearchParams(
  params: PageSearchParams | undefined,
  key: string = "lang"
): StorefrontLocale {
  if (!params) {
    return PRIMARY_LOCALE;
  }
  const raw = params[key];
  const value = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : null;
  return resolveStorefrontLocale(value);
}

export function getStorefrontLocaleFallbackChain(
  locale: StorefrontLocale
): StorefrontLocale[] {
  return Array.from(new Set<StorefrontLocale>([locale, "hy", "en"]));
}

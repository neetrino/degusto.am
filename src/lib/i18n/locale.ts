import type { NextRequest } from "next/server";

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

/** Resolves locale from `lang` query param, `shop_language` cookie, or Accept-Language. */
export function resolveStorefrontLocaleFromNextRequest(req: NextRequest): StorefrontLocale {
  const fromQuery = req.nextUrl.searchParams.get("lang");
  if (fromQuery) {
    return resolveStorefrontLocale(fromQuery);
  }

  const fromCookie = req.cookies.get("shop_language")?.value;
  if (fromCookie) {
    return resolveStorefrontLocale(fromCookie);
  }

  const acceptLanguage = req.headers.get("accept-language");
  if (acceptLanguage) {
    const first = acceptLanguage.split(",")[0] ?? "";
    const normalized = first.split("-")[0] ?? "";
    return resolveStorefrontLocale(normalized);
  }

  return PRIMARY_LOCALE;
}

export function getStorefrontLocaleFallbackChain(
  locale: StorefrontLocale
): StorefrontLocale[] {
  return Array.from(new Set<StorefrontLocale>([locale, "hy", "en"]));
}

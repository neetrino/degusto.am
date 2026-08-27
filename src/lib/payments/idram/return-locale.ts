import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

const LOCALE_COOKIE_NAMES = ["NEXT_LOCALE", "locale"] as const;

function cookieValue(header: string, name: string): string | undefined {
  const parts = header.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator === -1 || trimmed.slice(0, separator) !== name) {
      continue;
    }
    try {
      return decodeURIComponent(trimmed.slice(separator + 1));
    } catch {
      return trimmed.slice(separator + 1);
    }
  }
  return undefined;
}

function localeFromAcceptLanguage(header: string): Locale | null {
  const first = header.split(",")[0]?.split("-")[0]?.trim().toLowerCase();
  return first && isLocale(first) ? first : null;
}

/**
 * Locale for Idram user redirects: order snapshot, then cookie, then
 * Accept-Language, then hy.
 */
export function resolveIdramReturnLocale(
  request: Request,
  orderLocale: string | null | undefined,
): Locale {
  if (orderLocale && isLocale(orderLocale)) {
    return orderLocale;
  }
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const name of LOCALE_COOKIE_NAMES) {
    const value = cookieValue(cookieHeader, name);
    if (value && isLocale(value)) {
      return value;
    }
  }
  return (
    localeFromAcceptLanguage(request.headers.get("accept-language") ?? "") ??
    defaultLocale
  );
}

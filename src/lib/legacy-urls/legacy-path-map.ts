import {
  defaultLocale,
  isLocale,
  locales,
  type Locale,
} from "../i18n/config";
import { isLegacyPaymentPath } from "../payments/legacy-callback-paths";

/** Old static paths → new locale-relative destinations (no locale prefix). */
export const LEGACY_SECTION_DESTINATIONS: Readonly<Record<string, string>> = {
  "/about-us": "/about",
  "/contact-us": "/contact",
  "/basket": "/cart",
  "/login": "/login",
  "/register": "/register",
  "/terms-conditions": "/legal/terms",
  "/return": "/legal/returns",
  "/privacy-policy": "/legal/privacy",
};

/** Old `/language/:code` → new locale home. `am` is Armenian on the old site. */
export const LEGACY_LANGUAGE_DESTINATIONS: Readonly<Record<string, Locale>> = {
  en: "en",
  ru: "ru",
  am: "hy",
};

/**
 * Live degusto.am homepage category ids → new catalog/combo path.
 * Unknown ids fall back to `/{locale}/products`.
 */
export const LEGACY_CATEGORY_DESTINATIONS: Readonly<Record<string, string>> = {
  "1": "/products?category=soups-hot-dishes",
  "2": "/products?category=salads",
  "3": "/products?category=shawarma",
  "4": "/products?category=pizza",
  "5": "/products?category=lahmajoun",
  "6": "/products?category=khachapuri",
  "7": "/products?category=khorovats",
  "8": "/products?category=khinkali",
  "9": "/products?category=stuffed-potato",
  "10": "/products?category=burgers-sandwiches",
  "11": "/products?category=cakes-pancakes",
  "12": "/combo",
  "13": "/products?category=lunch-boxes",
  "14": "/products?category=grill-smoked",
  "15": "/products?category=bread",
  "16": "/products?category=pastry",
  "17": "/products?category=fried-eggs",
  "18": "/products?category=lenten-dishes",
  "19": "/products?category=bar",
  "20": "/products?category=asian-sushi",
  "21": "/products?category=pasta",
  "23": "/products?category=sauces",
  "1001": "/products?category=restaurant",
  "1002": "/products?category=bar-alcohol",
  "1005": "/products?category=juices-drinks",
  "1006": "/products?category=semi-finished",
  "1007": "/products?category=mexican",
};

export type LegacyNextRedirect = {
  source: string;
  destination: string;
  permanent: true;
  has?: Array<{ type: "query"; key: string; value: string }>;
};

const LOCALE_SOURCE = `/:locale(${locales.join("|")})`;
const PRODUCT_ID_PATTERN = /^\d{1,10}$/;

export function normalizeLegacyPathname(pathname: string): string {
  const pathOnly = pathname.split("?")[0] ?? "";
  const withoutTrailing = pathOnly.replace(/\/+$/, "");
  return (withoutTrailing || "/").toLowerCase();
}

/** True for `/product/1293` (no locale) so proxy does not prefix it into a 404. */
export function isUnprefixedLegacyProductIdPath(pathname: string): boolean {
  const normalized = normalizeLegacyPathname(pathname);
  const id = normalized.startsWith("/product/")
    ? normalized.slice("/product/".length)
    : "";
  return id.length > 0 && !id.includes("/") && PRODUCT_ID_PATTERN.test(id);
}

/**
 * Permanent destination for a static/shop/language leftover path.
 * Returns null for payment callbacks, current app routes, and `/product/:id`
 * lookup (handled by the product redirect page).
 */
export function resolveLegacyRedirect(
  pathname: string,
  searchParams?: URLSearchParams,
): string | null {
  const normalized = normalizeLegacyPathname(pathname);
  if (isLegacyPaymentPath(normalized)) {
    return null;
  }

  const { locale, remainder } = splitLegacyPath(normalized);
  if (isLegacyPaymentPath(remainder)) {
    return null;
  }

  const language = resolveLanguageRedirect(remainder);
  if (language) {
    return language;
  }

  const section = LEGACY_SECTION_DESTINATIONS[remainder];
  if (section) {
    return skipNoopRedirect(normalized, `/${locale}${section}`);
  }

  if (remainder === "/shop") {
    return skipNoopRedirect(
      normalized,
      resolveShopDestination(locale, searchParams),
    );
  }
  if (remainder.startsWith("/shop/")) {
    return skipNoopRedirect(normalized, `/${locale}/products`);
  }

  return skipNoopRedirect(
    normalized,
    resolveProductPathRedirect(locale, remainder),
  );
}

/** next.config `redirects()` rules for static/shop paths that do not need DB. */
export function buildLegacyNextRedirects(): LegacyNextRedirect[] {
  return [
    ...sectionRedirects(),
    ...languageRedirects(),
    ...shopCategoryRedirects(),
    ...shopFallbackRedirects(),
    ...productIndexRedirects(),
  ];
}

function splitLegacyPath(pathname: string): {
  locale: Locale;
  remainder: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isLocale(first)) {
    const rest = segments.slice(1);
    return {
      locale: first,
      remainder: rest.length > 0 ? `/${rest.join("/")}` : "/",
    };
  }
  return { locale: defaultLocale, remainder: pathname };
}

function resolveLanguageRedirect(remainder: string): string | null {
  if (!remainder.startsWith("/language/")) {
    return null;
  }
  const code = remainder.slice("/language/".length);
  if (!code || code.includes("/")) {
    return `/${defaultLocale}`;
  }
  const locale = LEGACY_LANGUAGE_DESTINATIONS[code] ?? defaultLocale;
  return `/${locale}`;
}

function resolveShopDestination(
  locale: Locale,
  searchParams?: URLSearchParams,
): string {
  const categoryId = searchParams?.get("category")?.trim() ?? "";
  if (!categoryId) {
    return `/${locale}/products`;
  }
  const mapped = LEGACY_CATEGORY_DESTINATIONS[categoryId];
  return mapped ? `/${locale}${mapped}` : `/${locale}/products`;
}

function resolveProductPathRedirect(
  locale: Locale,
  remainder: string,
): string | null {
  if (remainder === "/product") {
    return `/${locale}/products`;
  }
  if (!remainder.startsWith("/product/")) {
    return null;
  }
  const after = remainder.slice("/product/".length);
  if (!after.includes("/") && PRODUCT_ID_PATTERN.test(after)) {
    return null;
  }
  return `/${locale}/products`;
}

function pairLocaleRedirects(
  source: string,
  destination: string,
): LegacyNextRedirect[] {
  return [
    {
      source,
      destination: `/${defaultLocale}${destination}`,
      permanent: true,
    },
    {
      source: `${LOCALE_SOURCE}${source}`,
      destination: `/:locale${destination}`,
      permanent: true,
    },
  ];
}

function skipNoopRedirect(
  pathname: string,
  destination: string | null,
): string | null {
  if (!destination) {
    return null;
  }
  const destPath = destination.split("?")[0] ?? destination;
  return destPath === pathname ? null : destination;
}

function sectionRedirects(): LegacyNextRedirect[] {
  return Object.entries(LEGACY_SECTION_DESTINATIONS).flatMap(([source, dest]) => {
    const unprefixed: LegacyNextRedirect = {
      source,
      destination: `/${defaultLocale}${dest}`,
      permanent: true,
    };
    // `/login` and `/register` are already the new paths once locale-prefixed.
    if (source === dest) {
      return [unprefixed];
    }
    return pairLocaleRedirects(source, dest);
  });
}

function languageRedirects(): LegacyNextRedirect[] {
  return Object.entries(LEGACY_LANGUAGE_DESTINATIONS).flatMap(
    ([code, locale]) => [
      {
        source: `/language/${code}`,
        destination: `/${locale}`,
        permanent: true,
      },
      {
        source: `${LOCALE_SOURCE}/language/${code}`,
        destination: `/${locale}`,
        permanent: true,
      },
    ],
  );
}

function shopCategoryRedirects(): LegacyNextRedirect[] {
  return Object.entries(LEGACY_CATEGORY_DESTINATIONS).flatMap(([id, dest]) => [
    {
      source: "/shop",
      has: [{ type: "query", key: "category", value: id }],
      destination: `/${defaultLocale}${dest}`,
      permanent: true,
    },
    {
      source: `${LOCALE_SOURCE}/shop`,
      has: [{ type: "query", key: "category", value: id }],
      destination: `/:locale${dest}`,
      permanent: true,
    },
  ]);
}

function shopFallbackRedirects(): LegacyNextRedirect[] {
  return [
    ...pairLocaleRedirects("/shop", "/products"),
    ...pairLocaleRedirects("/shop/:path*", "/products"),
  ];
}

function productIndexRedirects(): LegacyNextRedirect[] {
  return pairLocaleRedirects("/product", "/products");
}

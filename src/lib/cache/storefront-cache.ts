import { cacheService } from "@/lib/services/cache.service";

/**
 * Central TTLs (seconds) for public storefront HTTP responses stored in Redis / in-memory fallback.
 * Tune via env only if needed later; defaults favor freshness vs load.
 */
export const STOREFRONT_CACHE_TTL = {
  categoriesTree: 300,
  categoryBySlug: 300,
  navigationPreviews: 180,
  currencyRates: 180,
  productsFilters: 120,
  productsPriceRange: 120,
  /** PDP first paint (images + identifiers). */
  productVisual: 300,
  /** PDP full product JSON for info column. */
  productDetails: 300,
  /** PDP related carousel (same shape as list items). */
  productRelated: 180,
} as const;

export const STOREFRONT_CACHE_KEYS = {
  categoriesTree: (lang: string) => `categories:tree:${lang}`,
  categoryBySlug: (lang: string, slug: string) => `categories:slug:${lang}:${slug}`,
  navigationPreviews: (lang: string) => `categories:navigation-previews:${lang}`,
  currencyRates: () => "settings:currency-rates",
  productsFilters: (stableQuery: string) => `products:filters:${stableQuery}`,
  productsPriceRange: (stableQuery: string) => `products:price-range:${stableQuery}`,
  productVisual: (lang: string, slug: string) => `product:visual:${lang}:${slug}`,
  productDetails: (lang: string, slug: string) => `product:details:${lang}:${slug}`,
  productRelated: (lang: string, slug: string) => `product:related:${lang}:${slug}`,
} as const;

/** Deterministic cache key fragment from URL search params (sorted keys). */
export function stableSearchParamsKey(searchParams: URLSearchParams): string {
  const pairs = Array.from(searchParams.entries()).sort(([a], [b]) => a.localeCompare(b));
  return pairs.map(([k, v]) => `${k}=${v}`).join("&");
}

export async function readJsonCache<T>(key: string): Promise<T | null> {
  const raw = await cacheService.get(key);
  if (raw === null || raw === undefined) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJsonCache(key: string, ttlSeconds: number, body: unknown): Promise<void> {
  await cacheService.setex(key, ttlSeconds, JSON.stringify(body));
}

/** After category create/update/delete (admin). */
export async function invalidateStorefrontCategoryCaches(): Promise<void> {
  await Promise.all([
    cacheService.deletePattern("categories:tree:*"),
    cacheService.deletePattern("categories:navigation-previews:*"),
    cacheService.deletePattern("categories:slug:*"),
    cacheService.deletePattern("categories:top:*"),
  ]);
}

/** Filters / price aggregates derived from product rows. */
export async function invalidateStorefrontProductFilterCaches(): Promise<void> {
  await Promise.all([
    cacheService.deletePattern("products:filters:*"),
    cacheService.deletePattern("products:price-range:*"),
  ]);
}

export async function invalidateCurrencyRatesCache(): Promise<void> {
  await cacheService.del(STOREFRONT_CACHE_KEYS.currencyRates());
}

/**
 * Call when products change (already clears `products:*` list cache elsewhere).
 * Clears nav previews and filter aggregates.
 */
export async function invalidateStorefrontProductRelatedCaches(): Promise<void> {
  await Promise.all([
    cacheService.deletePattern("categories:navigation-previews:*"),
    invalidateStorefrontProductFilterCaches(),
  ]);
}

/**
 * Admin settings (discounts, currency, etc.) affect public product payloads and rates.
 */
export async function invalidateStorefrontAfterAdminSettingsUpdate(): Promise<void> {
  await invalidateCurrencyRatesCache();
  await cacheService.deletePattern("products:*");
  await Promise.all([
    cacheService.deletePattern("product:visual:*"),
    cacheService.deletePattern("product:details:*"),
    cacheService.deletePattern("product:related:*"),
  ]);
  await invalidateStorefrontProductRelatedCaches();
}

/** Invalidate split PDP caches (visual / details / related). */
export async function invalidateProductPageCaches(): Promise<void> {
  await Promise.all([
    cacheService.deletePattern("product:visual:*"),
    cacheService.deletePattern("product:details:*"),
    cacheService.deletePattern("product:related:*"),
  ]);
}

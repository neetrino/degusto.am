import { revalidateTag } from "next/cache";
import { STOREFRONT_REDIS_TTL_SECONDS } from "@/constants/storefront-isr";
import { cacheService } from "@/lib/services/cache.service";
import { STOREFRONT_DISCOUNT_SETTINGS_CACHE_TAG } from "@/lib/services/storefront/get-storefront-discount-settings";

/**
 * Central TTLs (seconds) for public storefront HTTP responses stored in Redis / in-memory fallback.
 * Long TTL + admin invalidation — see `SIDE_CHECKLIST_SPEED.md`.
 */
export const STOREFRONT_CACHE_TTL = {
  categoriesTree: STOREFRONT_REDIS_TTL_SECONDS,
  categoryBySlug: STOREFRONT_REDIS_TTL_SECONDS,
  navigationPreviews: STOREFRONT_REDIS_TTL_SECONDS,
  currencyRates: STOREFRONT_REDIS_TTL_SECONDS,
  productsFilters: STOREFRONT_REDIS_TTL_SECONDS,
  productsPriceRange: STOREFRONT_REDIS_TTL_SECONDS,
  /** PDP first paint (images + identifiers). */
  productVisual: STOREFRONT_REDIS_TTL_SECONDS,
  /** PDP full product JSON for info column. */
  productDetails: STOREFRONT_REDIS_TTL_SECONDS,
  /** PDP bundle: product + review summary (SSR critical path). */
  productPdpBundle: STOREFRONT_REDIS_TTL_SECONDS,
  /** PDP related carousel (same shape as list items). */
  productRelated: STOREFRONT_REDIS_TTL_SECONDS,
} as const;

export const STOREFRONT_CACHE_KEYS = {
  categoriesTree: (lang: string) => `categories:tree:${lang}`,
  categoryBySlug: (lang: string, slug: string) => `categories:slug:${lang}:${slug}`,
  navigationPreviews: (lang: string) => `categories:navigation-previews:${lang}`,
  currencyRates: () => "settings:currency-rates",
  productsFilters: (stableQuery: string) => `products:filters:${stableQuery}`,
  productsPriceRange: (stableQuery: string) => `products:price-range:${stableQuery}`,
  productVisual: (lang: string, slug: string) => `product:visual:${lang}:${slug}`,
  productDetails: (lang: string, slug: string) => `product:details:v3:${lang}:${slug}`,
  productPdpBundle: (lang: string, slug: string) => `product:pdp-bundle:v2:${lang}:${slug}`,
  productRelated: (lang: string, slug: string) => `product:related:v2:${lang}:${slug}`,
  productRelatedCategory: (lang: string, categorySlug: string) =>
    `product:related-category:v2:${lang}:${categorySlug}`,
  productSlugId: (slug: string) => `product:slug-id:${slug}`,
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

/**
 * Read-through JSON cache: Redis/memory first, then `fetcher` on miss.
 * Single pattern for public storefront GET payloads.
 */
export async function getCachedJson<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await readJsonCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  await writeJsonCache(key, ttlSeconds, fresh);
  return fresh;
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
  // @ts-expect-error - revalidateTag type issue in Next.js
  revalidateTag(STOREFRONT_DISCOUNT_SETTINGS_CACHE_TAG);
  await cacheService.deletePattern("products:*");
  await Promise.all([
    cacheService.deletePattern("product:visual:*"),
    cacheService.deletePattern("product:details:*"),
    cacheService.deletePattern("product:pdp-bundle:*"),
    cacheService.deletePattern("product:related:*"),
    cacheService.deletePattern("product:related-category:*"),
    cacheService.deletePattern("product:slug-id:*"),
  ]);
  await invalidateStorefrontProductRelatedCaches();
}

/** Invalidate split PDP caches (visual / details / related). */
export async function invalidateProductPageCaches(): Promise<void> {
  await Promise.all([
    cacheService.deletePattern("product:visual:*"),
    cacheService.deletePattern("product:details:*"),
    cacheService.deletePattern("product:pdp-bundle:*"),
    cacheService.deletePattern("product:related:*"),
    cacheService.deletePattern("product:related-category:*"),
    cacheService.deletePattern("product:slug-id:*"),
  ]);
}

/** PLP + PDP + product-derived Redis caches after catalog writes. */
export async function invalidateProductReadCaches(): Promise<void> {
  await Promise.all([
    cacheService.deletePattern("products:*"),
    invalidateProductPageCaches(),
    invalidateStorefrontProductRelatedCaches(),
  ]);
}

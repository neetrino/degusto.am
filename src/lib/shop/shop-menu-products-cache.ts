import type { ShopMenuProductsResponse } from './fetch-shop-menu-products.client.types';
import {
  SHOP_MENU_CLIENT_CACHE_FRESH_MS,
  SHOP_MENU_CLIENT_CACHE_MAX_AGE_MS,
} from '@/constants/shop-menu-perf';

export {
  SHOP_MENU_CLIENT_CACHE_FRESH_MS,
  SHOP_MENU_CLIENT_CACHE_MAX_AGE_MS,
};

export const SHOP_MENU_CLIENT_CACHE_MAX_ENTRIES = 40;

type CacheEntry = {
  data: ShopMenuProductsResponse;
  fetchedAt: number;
};

export type ShopMenuProductsCachePeek = {
  data: ShopMenuProductsResponse;
  fresh: boolean;
};

const responseCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<ShopMenuProductsResponse>>();

function isFresh(entry: CacheEntry, now: number): boolean {
  return now - entry.fetchedAt <= SHOP_MENU_CLIENT_CACHE_FRESH_MS;
}

function isWithinMaxAge(entry: CacheEntry, now: number): boolean {
  return now - entry.fetchedAt <= SHOP_MENU_CLIENT_CACHE_MAX_AGE_MS;
}

function evictOldestCacheEntry(): void {
  const oldestKey = responseCache.keys().next().value;
  if (typeof oldestKey === 'string') {
    responseCache.delete(oldestKey);
  }
}

export function buildCanonicalSearch(search: string): string {
  const normalized = search.startsWith('?') ? search.slice(1) : search;
  if (!normalized) {
    return '';
  }
  const params = new URLSearchParams(normalized);
  const entries = Array.from(params.entries()).sort(([keyA, valueA], [keyB, valueB]) => {
    const keyCompare = keyA.localeCompare(keyB);
    if (keyCompare !== 0) {
      return keyCompare;
    }
    return valueA.localeCompare(valueB);
  });
  const stableParams = new URLSearchParams();
  for (const [key, value] of entries) {
    stableParams.append(key, value);
  }
  return stableParams.toString();
}

export type StorefrontMenuRouteBase = '/shop' | '/combo';

const MENU_PRODUCTS_API_PATH: Record<StorefrontMenuRouteBase, string> = {
  '/shop': '/api/v1/shop/menu-products',
  '/combo': '/api/v1/combo/menu-products',
};

/** Resolves `/shop` or `/combo` from a storefront menu href. */
export function resolveMenuRouteBaseFromHref(href: string): StorefrontMenuRouteBase {
  const pathEnd = href.indexOf('?');
  const path = pathEnd >= 0 ? href.slice(0, pathEnd) : href;
  if (path.startsWith('/combo')) {
    return '/combo';
  }
  return '/shop';
}

export function buildMenuProductsApiUrl(
  search: string,
  routeBase: StorefrontMenuRouteBase = '/shop'
): string {
  const canonical = buildCanonicalSearch(search);
  const apiPath = MENU_PRODUCTS_API_PATH[routeBase];
  return canonical ? `${apiPath}?${canonical}` : apiPath;
}

export function hrefToMenuProductsApiUrl(href: string): string {
  const questionIndex = href.indexOf('?');
  const search = questionIndex >= 0 ? href.slice(questionIndex) : '';
  return buildMenuProductsApiUrl(search, resolveMenuRouteBaseFromHref(href));
}

export function rememberShopMenuProductsResponse(url: string, data: ShopMenuProductsResponse): void {
  responseCache.set(url, { data, fetchedAt: Date.now() });
  if (responseCache.size <= SHOP_MENU_CLIENT_CACHE_MAX_ENTRIES) {
    return;
  }
  evictOldestCacheEntry();
}

export function peekShopMenuProductsCache(url: string): ShopMenuProductsCachePeek | null {
  const entry = responseCache.get(url);
  if (!entry) {
    return null;
  }
  const now = Date.now();
  if (!isWithinMaxAge(entry, now)) {
    responseCache.delete(url);
    return null;
  }
  return {
    data: entry.data,
    fresh: isFresh(entry, now),
  };
}

/** Visits non-expired cache entries (e.g. taste-filter preview derivation). */
export function forEachValidShopMenuProductsCacheEntry(
  visitor: (url: string, data: ShopMenuProductsResponse) => void
): void {
  const now = Date.now();
  for (const [url, entry] of responseCache) {
    if (!isWithinMaxAge(entry, now)) {
      responseCache.delete(url);
      continue;
    }
    visitor(url, entry.data);
  }
}

/** Seeds client cache from SSR props so repeat soft-nav skips a network round trip. */
export function seedShopMenuProductsCache(href: string, data: ShopMenuProductsResponse): void {
  rememberShopMenuProductsResponse(hrefToMenuProductsApiUrl(href), data);
}

export function clearShopMenuProductsClientCache(): void {
  responseCache.clear();
}

export function getShopMenuProductsInflight(
  url: string
): Promise<ShopMenuProductsResponse> | undefined {
  return inflightRequests.get(url);
}

export function setShopMenuProductsInflight(
  url: string,
  request: Promise<ShopMenuProductsResponse>
): void {
  inflightRequests.set(url, request);
}

export function deleteShopMenuProductsInflight(url: string): void {
  inflightRequests.delete(url);
}

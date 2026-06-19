'use client';

/** Product tile payload shared by wishlist page cards and client-side snapshot cache. */
export type WishlistProductSnapshot = {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  image: string | null;
  inStock: boolean;
};

const WISHLIST_PRODUCTS_CACHE_KEY = 'wishlist-page-products-v1';

function readCacheMap(): Map<string, WishlistProductSnapshot> {
  if (typeof window === 'undefined') {
    return new Map();
  }
  try {
    const raw = window.sessionStorage.getItem(WISHLIST_PRODUCTS_CACHE_KEY);
    if (!raw) {
      return new Map();
    }
    const parsed = JSON.parse(raw) as WishlistProductSnapshot[];
    if (!Array.isArray(parsed)) {
      return new Map();
    }
    const map = new Map<string, WishlistProductSnapshot>();
    for (const product of parsed) {
      if (product?.id) {
        map.set(product.id, product);
      }
    }
    return map;
  } catch {
    return new Map();
  }
}

function writeCacheMap(map: Map<string, WishlistProductSnapshot>): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(
      WISHLIST_PRODUCTS_CACHE_KEY,
      JSON.stringify(Array.from(map.values()))
    );
  } catch {
    // best-effort cache write only
  }
}

/** Returns cached wishlist products in the same order as `ids`. */
export function getWishlistProductsForIds(ids: string[]): WishlistProductSnapshot[] {
  if (ids.length === 0) {
    return [];
  }
  const map = readCacheMap();
  return ids
    .map((id) => map.get(id))
    .filter((product): product is WishlistProductSnapshot => product !== undefined);
}

/** Reads all cached wishlist products (order not guaranteed). */
export function readCachedWishlistProducts(): WishlistProductSnapshot[] {
  return Array.from(readCacheMap().values());
}

/** Merges API or card snapshots into session cache. */
export function upsertWishlistProductSnapshot(product: WishlistProductSnapshot): void {
  const map = readCacheMap();
  map.set(product.id, product);
  writeCacheMap(map);
}

/** Removes one product from the session cache after wishlist removal. */
export function removeWishlistProductSnapshot(productId: string): void {
  const map = readCacheMap();
  if (!map.delete(productId)) {
    return;
  }
  writeCacheMap(map);
}

/** Replaces cache entries with fresh API data while preserving unrelated snapshots. */
export function mergeWishlistProductSnapshots(products: WishlistProductSnapshot[]): void {
  const map = readCacheMap();
  for (const product of products) {
    map.set(product.id, product);
  }
  writeCacheMap(map);
}

/** Clears all cached wishlist product snapshots (e.g. on logout). */
export function clearWishlistProductSnapshots(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.removeItem(WISHLIST_PRODUCTS_CACHE_KEY);
  } catch {
    // best-effort cache clear only
  }
}

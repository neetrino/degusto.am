'use client';

import type { WishlistProductSnapshot } from './wishlist-product-snapshot';

const WISHLIST_PRODUCTS_CACHE_KEY = 'wishlist-page-products-v1';

export function readCachedWishlistProducts(): WishlistProductSnapshot[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.sessionStorage.getItem(WISHLIST_PRODUCTS_CACHE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as WishlistProductSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeCachedWishlistProducts(products: WishlistProductSnapshot[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.sessionStorage.setItem(WISHLIST_PRODUCTS_CACHE_KEY, JSON.stringify(products));
  } catch {
    // best-effort cache write only
  }
}

export function upsertWishlistProductSnapshot(snapshot: WishlistProductSnapshot): void {
  const cached = readCachedWishlistProducts();
  const next = cached.filter((product) => product.id !== snapshot.id);
  next.unshift(snapshot);
  writeCachedWishlistProducts(next);
}

export function removeWishlistProductFromCache(productId: string): void {
  const cached = readCachedWishlistProducts();
  if (!cached.some((product) => product.id === productId)) {
    return;
  }
  writeCachedWishlistProducts(cached.filter((product) => product.id !== productId));
}

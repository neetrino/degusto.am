'use client';

import { fetchCompareCount } from './compare-api';
import { fetchWishlistCount } from './wishlist-api';

/**
 * Retrieves wishlist item count from the database API.
 */
export async function getWishlistCount(): Promise<number> {
  return fetchWishlistCount();
}

/**
 * Retrieves compare item count from the database API.
 */
export async function getCompareCount(): Promise<number> {
  return fetchCompareCount();
}

'use client';

import { apiClient } from './api-client';
import { fetchWithInflightKey } from '@/lib/admin/inflight-get-cache';
import {
  fetchWishlistIdsViaCommerceBootstrap,
  invalidateStorefrontCommerceStateCache,
} from '@/lib/storefront/fetch-storefront-commerce-state';
import { logger } from './utils/logger';

const WISHLIST_DIRECT_INFLIGHT_KEY = 'storefront-wishlist-direct';

/** Clears bootstrap + in-flight GET dedupe so the next fetch reflects a recent add/remove. */
export function invalidateWishlistIdsCache(): void {
  invalidateStorefrontCommerceStateCache();
}

async function fetchWishlistIdsDirectFromApi(): Promise<string[]> {
  return fetchWithInflightKey(WISHLIST_DIRECT_INFLIGHT_KEY, async () => {
    const response = await apiClient.get<{ ids?: string[] }>('/api/v1/users/wishlist');
    return Array.isArray(response.ids) ? response.ids : [];
  });
}

export async function fetchWishlistIds(options?: { forceDirect?: boolean }): Promise<string[]> {
  try {
    if (!options?.forceDirect) {
      return await fetchWishlistIdsViaCommerceBootstrap();
    }
    return await fetchWishlistIdsDirectFromApi();
  } catch (error) {
    logger.warn('[Wishlist] Failed to load ids from API', { error });
    return [];
  }
}

export async function fetchWishlistCount(): Promise<number> {
  const ids = await fetchWishlistIds();
  return ids.length;
}

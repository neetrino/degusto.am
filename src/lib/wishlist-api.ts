'use client';

import { apiClient } from './api-client';
import { logger } from './utils/logger';

let inflightWishlistIdsRequest: Promise<string[]> | null = null;

export async function fetchWishlistIds(): Promise<string[]> {
  if (inflightWishlistIdsRequest) {
    return inflightWishlistIdsRequest;
  }

  inflightWishlistIdsRequest = (async () => {
    try {
      const response = await apiClient.get<{ ids?: string[] }>('/api/v1/users/wishlist');
      return Array.isArray(response.ids) ? response.ids : [];
    } catch (error) {
      logger.warn('[Wishlist] Failed to load ids from API', { error });
      return [];
    } finally {
      inflightWishlistIdsRequest = null;
    }
  })();

  return inflightWishlistIdsRequest;
}

export async function fetchWishlistCount(): Promise<number> {
  const ids = await fetchWishlistIds();
  return ids.length;
}

'use client';

import { apiClient } from './api-client';
import { fetchWithInflightKey } from '@/lib/admin/inflight-get-cache';
import {
  fetchCompareIdsViaCommerceBootstrap,
  invalidateStorefrontCommerceStateCache,
} from '@/lib/storefront/fetch-storefront-commerce-state';
import { logger } from './utils/logger';

const COMPARE_DIRECT_INFLIGHT_KEY = 'storefront-compare-direct';

/** Dispatched when compare list contents change (after DB sync). */
export function emitCompareUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('compare-updated'));
  }
}

export function invalidateCompareIdsCache(): void {
  invalidateStorefrontCommerceStateCache();
}

async function fetchCompareIdsDirectFromApi(): Promise<string[]> {
  return fetchWithInflightKey(COMPARE_DIRECT_INFLIGHT_KEY, async () => {
    const response = await apiClient.get<{ ids?: string[] }>('/api/v1/compare');
    return Array.isArray(response.ids) ? response.ids : [];
  });
}

export async function fetchCompareIds(options?: { forceDirect?: boolean }): Promise<string[]> {
  try {
    if (!options?.forceDirect) {
      return await fetchCompareIdsViaCommerceBootstrap();
    }
    return await fetchCompareIdsDirectFromApi();
  } catch (error) {
    logger.warn('[Compare] Failed to load ids from API', { error });
    return [];
  }
}

export async function fetchCompareCount(): Promise<number> {
  const ids = await fetchCompareIds();
  return ids.length;
}

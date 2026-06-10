'use client';

import { apiClient } from './api-client';
import { logger } from './utils/logger';

let inflightCompareIdsRequest: Promise<string[]> | null = null;

/** Dispatched when compare list contents change (after DB sync). */
export function emitCompareUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('compare-updated'));
  }
}

export async function fetchCompareIds(): Promise<string[]> {
  if (inflightCompareIdsRequest) {
    return inflightCompareIdsRequest;
  }

  inflightCompareIdsRequest = (async () => {
    try {
      const response = await apiClient.get<{ ids?: string[] }>('/api/v1/compare');
      return Array.isArray(response.ids) ? response.ids : [];
    } catch (error) {
      logger.warn('[Compare] Failed to load ids from API', { error });
      return [];
    } finally {
      inflightCompareIdsRequest = null;
    }
  })();

  return inflightCompareIdsRequest;
}

export async function fetchCompareCount(): Promise<number> {
  const ids = await fetchCompareIds();
  return ids.length;
}

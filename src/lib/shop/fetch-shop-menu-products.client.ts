'use client';

import type { MenuCard } from '@/components/home/menu-types';

import { getStoredLanguage } from '@/lib/language';
import { PRIMARY_LOCALE } from '@/lib/i18n/locale';
import { logger } from '@/lib/utils/logger';

export type ShopMenuProductsResponse = {
  cards: MenuCard[];
  effectivePage: number;
  totalPages: number;
};

const inflightRequests = new Map<string, Promise<ShopMenuProductsResponse>>();
const responseCache = new Map<string, ShopMenuProductsResponse>();

function buildMenuProductsApiUrl(search: string): string {
  const normalized = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  const clientLang = getStoredLanguage();
  if (!params.has('lang') && clientLang !== PRIMARY_LOCALE) {
    params.set('lang', clientLang);
  }
  const query = params.toString();
  return query ? `/api/v1/shop/menu-products?${query}` : '/api/v1/shop/menu-products';
}

function hrefToSearch(href: string): string {
  const questionIndex = href.indexOf('?');
  return questionIndex >= 0 ? href.slice(questionIndex) : '';
}

/** Prefetch product grid JSON for a shop category href (hover / mount). */
export function prefetchShopMenuProducts(href: string): void {
  const search = hrefToSearch(href);
  const url = buildMenuProductsApiUrl(search);
  if (responseCache.has(url) || inflightRequests.has(url)) {
    return;
  }
  const request = fetch(url, { credentials: 'include' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Shop menu products prefetch failed: ${response.status}`);
      }
      return (await response.json()) as ShopMenuProductsResponse;
    })
    .then((data) => {
      responseCache.set(url, data);
      return data;
    })
    .catch((error: unknown) => {
      logger.warn('[Shop] Menu products prefetch failed', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    })
    .finally(() => {
      inflightRequests.delete(url);
    });
  void request.catch(() => {
    // Prefetch is fire-and-forget; rejection is already logged above.
  });
  inflightRequests.set(url, request);
}

/** Fetches paginated shop product cards without a full RSC navigation. */
export async function fetchShopMenuProducts(href: string): Promise<ShopMenuProductsResponse> {
  const search = hrefToSearch(href);
  const url = buildMenuProductsApiUrl(search);
  const cached = responseCache.get(url);
  if (cached) {
    return cached;
  }

  const inflight = inflightRequests.get(url);
  if (inflight) {
    return inflight;
  }

  const request = fetch(url, { credentials: 'include' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Shop menu products fetch failed: ${response.status}`);
      }
      return (await response.json()) as ShopMenuProductsResponse;
    })
    .then((data) => {
      responseCache.set(url, data);
      return data;
    })
    .finally(() => {
      inflightRequests.delete(url);
    });

  inflightRequests.set(url, request);
  return request;
}

/** Clears client cache when filters change server-side (search, price, taste). */
export function clearShopMenuProductsClientCache(): void {
  responseCache.clear();
}

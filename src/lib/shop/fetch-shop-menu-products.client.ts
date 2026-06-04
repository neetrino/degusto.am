'use client';

import type { MenuCard } from '@/components/home/menu-types';

export type ShopMenuProductsResponse = {
  cards: MenuCard[];
  effectivePage: number;
  totalPages: number;
};

const inflightRequests = new Map<string, Promise<ShopMenuProductsResponse>>();
const responseCache = new Map<string, ShopMenuProductsResponse>();

function buildMenuProductsApiUrl(search: string): string {
  const normalized = search.startsWith('?') ? search.slice(1) : search;
  return normalized ? `/api/v1/shop/menu-products?${normalized}` : '/api/v1/shop/menu-products';
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
    .finally(() => {
      inflightRequests.delete(url);
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

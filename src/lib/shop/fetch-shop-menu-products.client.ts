'use client';

import {
  parseProductCardApiJsonToMenuCard,
  type ProductCardApiJson,
} from '@/lib/storefront/product-card-dto';
import { logger } from '@/lib/utils/logger';
import type { ShopMenuProductsResponse } from './fetch-shop-menu-products.client.types';
import {
  deleteShopMenuProductsInflight,
  getShopMenuProductsInflight,
  hrefToMenuProductsApiUrl,
  peekShopMenuProductsCache,
  rememberShopMenuProductsResponse,
  seedShopMenuProductsCache,
  setShopMenuProductsInflight,
  clearShopMenuProductsClientCache,
} from './shop-menu-products-cache';

export type { ShopMenuProductsResponse } from './fetch-shop-menu-products.client.types';
export {
  clearShopMenuProductsClientCache,
  peekShopMenuProductsCache,
  seedShopMenuProductsCache,
} from './shop-menu-products-cache';

function normalizeShopMenuProductsResponse(
  payload: {
    cards: ProductCardApiJson[];
    effectivePage: number;
    totalPages: number;
  }
): ShopMenuProductsResponse {
  return {
    cards: payload.cards.map(parseProductCardApiJsonToMenuCard),
    effectivePage: payload.effectivePage,
    totalPages: payload.totalPages,
  };
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException
      ? error.name === 'AbortError'
      : error instanceof Error && error.name === 'AbortError'
  );
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
}

function raceInflightWithSignal<T>(
  inflight: Promise<T>,
  signal: AbortSignal | undefined
): Promise<T> {
  if (!signal) {
    return inflight;
  }
  throwIfAborted(signal);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
    inflight.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      }
    );
  });
}

async function fetchShopMenuProductsFromNetwork(
  url: string,
  signal?: AbortSignal
): Promise<ShopMenuProductsResponse> {
  const response = await fetch(url, { credentials: 'include', signal });
  if (!response.ok) {
    throw new Error(`Shop menu products fetch failed: ${response.status}`);
  }
  return normalizeShopMenuProductsResponse(
    (await response.json()) as {
      cards: ProductCardApiJson[];
      effectivePage: number;
      totalPages: number;
    }
  );
}

function startNetworkRequest(
  url: string,
  signal?: AbortSignal
): Promise<ShopMenuProductsResponse> {
  const existing = getShopMenuProductsInflight(url);
  if (existing) {
    return raceInflightWithSignal(existing, signal);
  }

  const request = fetchShopMenuProductsFromNetwork(url, signal)
    .then((data) => {
      rememberShopMenuProductsResponse(url, data);
      return data;
    })
    .finally(() => {
      deleteShopMenuProductsInflight(url);
    });

  setShopMenuProductsInflight(url, request);
  return raceInflightWithSignal(request, signal);
}

/** Fire-and-forget revalidation for stale entries (SWR). */
function revalidateShopMenuProductsInBackground(url: string): void {
  if (getShopMenuProductsInflight(url) || peekShopMenuProductsCache(url)?.fresh) {
    return;
  }
  void startNetworkRequest(url).catch((error: unknown) => {
    if (!isAbortError(error)) {
      logger.warn('[Shop] Background menu products revalidation failed', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/** Prefetch product grid JSON for a shop category href (hover / idle). */
export function prefetchShopMenuProducts(href: string): void {
  const url = hrefToMenuProductsApiUrl(href);
  const cached = peekShopMenuProductsCache(url);
  if (cached?.fresh) {
    return;
  }
  if (getShopMenuProductsInflight(url)) {
    return;
  }
  void startNetworkRequest(url).catch((error: unknown) => {
    if (!isAbortError(error)) {
      logger.warn('[Shop] Menu products prefetch failed', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/**
 * Fetches paginated shop product cards without a full RSC navigation.
 * Fresh cache (<30s): instant. Stale cache (<2m): return + background revalidate.
 */
export async function fetchShopMenuProducts(
  href: string,
  options?: { signal?: AbortSignal; forceNetwork?: boolean }
): Promise<ShopMenuProductsResponse> {
  throwIfAborted(options?.signal);

  const url = hrefToMenuProductsApiUrl(href);

  if (!options?.forceNetwork) {
    const cached = peekShopMenuProductsCache(url);
    if (cached?.fresh) {
      return cached.data;
    }
    if (cached) {
      revalidateShopMenuProductsInBackground(url);
      return cached.data;
    }
  }

  return startNetworkRequest(url, options?.signal);
}

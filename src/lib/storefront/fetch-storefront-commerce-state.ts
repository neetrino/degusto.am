'use client';

import type { Cart } from '@/app/cart/types';
import { apiClient } from '@/lib/api-client';
import { createInflightGetCache } from '@/lib/admin/inflight-get-cache';
import type { StorefrontCommerceState } from '@/lib/services/storefront/storefront-commerce-state.service';

/** Short TTL covers React Strict Mode remount; invalidated after cart/wishlist mutations. */
const COMMERCE_STATE_CACHE_TTL_MS = 4_000;

const commerceStateCache = createInflightGetCache<StorefrontCommerceState>(
  COMMERCE_STATE_CACHE_TTL_MS
);

export function invalidateStorefrontCommerceStateCache(): void {
  commerceStateCache.invalidate();
}

export async function fetchStorefrontCommerceState(): Promise<StorefrontCommerceState> {
  return commerceStateCache.fetch(() =>
    apiClient.get<StorefrontCommerceState>('/api/v1/storefront/commerce-state')
  );
}

export async function fetchCartViaCommerceBootstrap(): Promise<Cart | null> {
  const state = await fetchStorefrontCommerceState();
  return state.cart;
}

export async function fetchWishlistIdsViaCommerceBootstrap(): Promise<string[]> {
  const state = await fetchStorefrontCommerceState();
  return state.wishlistIds;
}

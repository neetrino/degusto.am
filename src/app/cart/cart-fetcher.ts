import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import { isQuietCartReadServerError } from '../../lib/api-client/error-handler';
import { fetchWithInflightKey } from '@/lib/admin/inflight-get-cache';
import { fetchCartViaCommerceBootstrap } from '@/lib/storefront/fetch-storefront-commerce-state';
import { logger } from '../../lib/utils/logger';
import type { Cart } from './types';

const CART_DIRECT_INFLIGHT_KEY = 'storefront-cart-direct';

type FetchCartOptions = {
  /** Bypass commerce bootstrap and read cart directly (post-mutation reconcile). */
  forceDirect?: boolean;
};

/**
 * Full cart read — used for drawer, checkout, and post-mutation reconcile.
 * Bootstrap/summary reads go through commerce-state (`fetchCartViaCommerceBootstrap`).
 */
async function fetchCartDirectFromApi(): Promise<Cart | null> {
  return fetchWithInflightKey(CART_DIRECT_INFLIGHT_KEY, async () => {
    const response = await apiClient.get<{ cart: Cart | null }>('/api/v1/cart');
    return response.cart;
  });
}

/**
 * Fetch cart from database (authenticated user or guest session cookie).
 */
export async function fetchCartFromApi(options?: FetchCartOptions): Promise<Cart | null> {
  try {
    if (!options?.forceDirect) {
      return await fetchCartViaCommerceBootstrap();
    }

    return await fetchCartDirectFromApi();
  } catch (error: unknown) {
    if (error instanceof ApiError && isQuietCartReadServerError(error.status, '/api/v1/cart')) {
      logger.warn('[CART] Cart read failed with server error; using empty state', {
        status: error.status,
      });
      return null;
    }
    logger.error('Error fetching cart', { error });
    return null;
  }
}

/** @deprecated Use fetchCartFromApi — kept for call-site compatibility. */
export async function fetchCart(
  _isLoggedIn: boolean,
  _t: (key: string) => string,
  options?: FetchCartOptions
): Promise<Cart | null> {
  return fetchCartFromApi(options);
}

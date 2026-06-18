import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import { isQuietCartReadServerError } from '../../lib/api-client/error-handler';
import { logger } from '../../lib/utils/logger';
import type { Cart } from './types';
import { normalizeCartApiResponse } from '@/lib/cart/cart-client-normalization';

let inFlightCartRequest: Promise<Cart | null> | null = null;

/**
 * Fetch cart from database (authenticated user or guest session cookie).
 */
export async function fetchCartFromApi(): Promise<Cart | null> {
  if (inFlightCartRequest) {
    return inFlightCartRequest;
  }

  const request = (async () => {
    try {
      // Drawer/live cart state requires full line items; summary-only payload causes
      // count/items mismatches after refresh (itemsCount > 0 while items is empty).
      const response = await apiClient.get<unknown>('/api/v1/cart');
      return normalizeCartApiResponse(response);
    } catch (error: unknown) {
      if (error instanceof ApiError && isQuietCartReadServerError(error.status, '/api/v1/cart')) {
        logger.warn('[CART] Cart read failed with server error; preserving current state', {
          status: error.status,
        });
        throw error;
      }
      logger.error('Error fetching cart', { error });
      throw error;
    }
  })();

  inFlightCartRequest = request;
  try {
    return await request;
  } finally {
    if (inFlightCartRequest === request) {
      inFlightCartRequest = null;
    }
  }
}

/** @deprecated Use fetchCartFromApi — kept for call-site compatibility. */
export async function fetchCart(
  _isLoggedIn: boolean,
  _t: (key: string) => string
): Promise<Cart | null> {
  return fetchCartFromApi();
}

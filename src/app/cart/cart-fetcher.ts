import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import { isQuietCartReadServerError } from '../../lib/api-client/error-handler';
import { logger } from '../../lib/utils/logger';
import type { Cart } from './types';

/**
 * Fetch cart from database (authenticated user or guest session cookie).
 */
export async function fetchCartFromApi(): Promise<Cart | null> {
  try {
    const response = await apiClient.get<{ cart: Cart | null }>('/api/v1/cart');
    return response.cart;
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
  _t: (key: string) => string
): Promise<Cart | null> {
  return fetchCartFromApi();
}

import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import { isQuietCartReadServerError } from '../../lib/api-client/error-handler';
import type { Cart } from './types';
import { normalizeCartApiResponse } from '@/lib/cart/cart-client-normalization';
import { logCartFrontendDiagnostic } from '@/lib/cart/cart-frontend-diagnostics';

let inFlightCartRequest: Promise<Cart | null> | null = null;
let requestSequenceCounter = 0;

/**
 * Fetch cart from database (authenticated user or guest session cookie).
 */
export async function fetchCartFromApi(): Promise<Cart | null> {
  if (inFlightCartRequest) {
    return inFlightCartRequest;
  }
  const requestSequenceId = `read-${++requestSequenceCounter}`;
  const endpoint = '/api/v1/cart';

  const request = (async () => {
    try {
      // Drawer/live cart state requires full line items; summary-only payload causes
      // count/items mismatches after refresh (itemsCount > 0 while items is empty).
      const response = await apiClient.get<unknown>(endpoint);
      return normalizeCartApiResponse(response);
    } catch (error: unknown) {
      if (error instanceof ApiError && isQuietCartReadServerError(error.status, endpoint)) {
        logCartFrontendDiagnostic({
          event: 'cart_read_failed',
          operation: 'read',
          endpoint,
          requestSequenceId,
          status: error.status,
          error,
        });
        throw error;
      }
      logCartFrontendDiagnostic({
        event: 'cart_read_failed',
        operation: 'read',
        endpoint,
        requestSequenceId,
        status: error instanceof ApiError ? error.status : null,
        error,
      });
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

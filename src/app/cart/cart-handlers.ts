import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import type { Cart, CartItem } from './types';
import {
  publishCartUpdated,
  publishCartForceReload,
  resetCartBadgeState,
} from '../../lib/cart/cart-events';
import { maxCartLineQuantity } from '@/lib/product-stock';
import {
  isOptimisticCartItemId,
  markCartLineRemoved,
} from '@/lib/cart/pending-cart-removals';
import { getCartLineId, removeCachedLineId } from '@/lib/cart/cart-line-id-cache';
import { deleteMatchingCartLineInBackground } from '@/lib/cart/background-line-cleanup';
import { normalizeCartApiResponse } from '@/lib/cart/cart-client-normalization';
import { logCartFrontendDiagnostic } from '@/lib/cart/cart-frontend-diagnostics';

/** Item already removed server-side (e.g. duplicate minus click after optimistic delete). */
function isCartItemNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 404) {
    return true;
  }
  if (!error || typeof error !== 'object') {
    return false;
  }

  const errorObj = error as {
    status?: number;
    message?: string;
    data?: unknown;
    response?: { status?: number };
    cause?: unknown;
  };

  const nestedStatus =
    errorObj.status ??
    errorObj.response?.status ??
    ((errorObj.cause as { status?: number } | undefined)?.status ?? undefined);

  if (nestedStatus === 404) {
    return true;
  }

  const nestedData = errorObj.data as { status?: number; detail?: string; message?: string } | undefined;
  if (nestedData?.status === 404) {
    return true;
  }

  const message = (nestedData?.detail ?? nestedData?.message ?? errorObj.message ?? '').toLowerCase();
  return message.includes('404') || message.includes('not found');
}

/**
 * Calculate cart totals
 */
function calculateCartTotals(items: CartItem[], existingTotals: Cart['totals']): Cart['totals'] {
  const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
  return {
    ...existingTotals,
    subtotal: newSubtotal,
    total: newSubtotal + existingTotals.tax + existingTotals.shipping - existingTotals.discount,
  };
}

/**
 * Handle remove item from cart
 */
export async function handleRemoveItem(
  itemId: string,
  cart: Cart,
  _isLoggedIn: boolean,
  setCart: (cart: Cart | null) => void,
  fetchCart: () => Promise<void>
): Promise<void> {
  const requestSequenceId = `delete-${Date.now().toString(36)}`;
  const endpoint = `/api/v1/cart/items/${itemId}`;
  const itemToRemove = cart.items.find((item) => item.id === itemId);
  if (!itemToRemove) {
    return;
  }

  markCartLineRemoved(itemToRemove);
  const cachedLine = getCartLineId(
    itemToRemove.variant.product.id,
    itemToRemove.variant.id,
    itemToRemove.customizations
  );
  removeCachedLineId(
    itemToRemove.variant.product.id,
    itemToRemove.variant.id,
    itemToRemove.customizations
  );

  const updatedItems = cart.items.filter((item) => item.id !== itemId);
  const newItemsCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
  const updatedTotals = calculateCartTotals(updatedItems, cart.totals);

  setCart({
    ...cart,
    items: updatedItems,
    totals: updatedTotals,
    itemsCount: newItemsCount,
  });
  if (newItemsCount === 0) {
    resetCartBadgeState();
  } else {
    publishCartUpdated(newItemsCount, updatedTotals.total, { skipReconcile: true });
  }

  if (isOptimisticCartItemId(itemId)) {
    void deleteMatchingCartLineInBackground(itemToRemove, cachedLine?.cartItemId);
    return;
  }

  try {
    const response = await apiClient.delete<unknown>(endpoint);
    const normalizedCart = normalizeCartApiResponse(response);
    setCart(normalizedCart);
    publishCartUpdated(normalizedCart.itemsCount, normalizedCart.totals.total, {
      skipReconcile: true,
    });
  } catch (error: unknown) {
    if (isCartItemNotFoundError(error)) {
      logCartFrontendDiagnostic({
        event: 'mutation_failed',
        operation: 'delete',
        endpoint,
        requestSequenceId,
        status: 404,
        preservedPreviousState: true,
        details: { reason: 'already_removed' },
      });
      return;
    }

    logCartFrontendDiagnostic({
      event: 'mutation_failed',
      operation: 'delete',
      endpoint,
      requestSequenceId,
      status: error instanceof ApiError ? error.status : null,
      preservedPreviousState: true,
      error,
      details: {
        itemId,
      },
    });
    await fetchCart();
    publishCartForceReload();
  }
}

/**
 * Handle update item quantity in cart
 */
export async function handleUpdateQuantity(
  itemId: string,
  quantity: number,
  cart: Cart | null,
  _isLoggedIn: boolean,
  setCart: (cart: Cart | null) => void,
  fetchCart: () => Promise<void>,
  t: (key: string) => string
): Promise<void> {
  const requestSequenceId = `update-${Date.now().toString(36)}`;
  const endpoint = `/api/v1/cart/items/${itemId}`;
  if (quantity < 1) {
    if (cart) {
      await handleRemoveItem(itemId, cart, false, setCart, fetchCart);
    }
    return;
  }

  const cartItem = cart?.items.find((item) => item.id === itemId);
  if (!cartItem) {
    return;
  }

  if (cartItem.variant.stock !== undefined) {
    const maxAllowed = maxCartLineQuantity(
      cartItem.variant.stock,
      cartItem.variant.id,
      itemId,
      cart?.items ?? []
    );
    if (quantity > maxAllowed) {
      alert(
        t('common.alerts.stockExceeded').replace('{stock}', String(maxAllowed))
      );
      return;
    }
  }

  if (cart) {
    const updatedItems = cart.items.map((item) =>
      item.id === itemId
        ? { ...item, quantity, total: item.price * quantity }
        : item
    );
    const newItemsCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const updatedTotals = calculateCartTotals(updatedItems, cart.totals);

    setCart({
      ...cart,
      items: updatedItems,
      totals: updatedTotals,
      itemsCount: newItemsCount,
    });
    publishCartUpdated(newItemsCount, updatedTotals.total, { skipReconcile: true });
  }

  if (isOptimisticCartItemId(itemId)) {
    return;
  }

  try {
    const response = await apiClient.patch<unknown>(endpoint, {
      quantity,
    });
    const normalizedCart = normalizeCartApiResponse(response);
    setCart(normalizedCart);
    publishCartUpdated(normalizedCart.itemsCount, normalizedCart.totals.total, {
      skipReconcile: true,
    });
  } catch (error: unknown) {
    await fetchCart();
    publishCartForceReload();

    if (isCartItemNotFoundError(error)) {
      return;
    }

    const errorObj = error as { detail?: string; message?: string };
    logCartFrontendDiagnostic({
      event: 'mutation_failed',
      operation: 'update',
      endpoint,
      requestSequenceId,
      status: error instanceof ApiError ? error.status : null,
      preservedPreviousState: true,
      error,
      details: {
        itemId,
        attemptedQuantity: quantity,
      },
    });

    const errorMessage =
      errorObj?.detail || errorObj?.message || t('common.messages.failedToUpdateQuantity');
    if (errorMessage.includes('stock') || errorMessage.includes('exceeds')) {
      alert(t('common.alerts.stockInsufficient').replace('{message}', errorMessage));
    } else {
      alert(errorMessage);
    }
  }
}

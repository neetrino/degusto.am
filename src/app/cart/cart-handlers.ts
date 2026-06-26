import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import { logger } from '../../lib/utils/logger';
import type { Cart, CartItem } from './types';
import {
  publishCartUpdated,
  publishCartForceReload,
  resetCartBadgeState,
  invalidateCommerceBootstrapAfterCartMutation,
} from '../../lib/cart/cart-events';
import { maxCartLineQuantity } from '@/lib/product-stock';
import {
  buildCartLineRemovalKey,
  isOptimisticCartItemId,
  markCartLineRemoved,
} from '@/lib/cart/pending-cart-removals';
import { getCartLineId, removeCachedLineId } from '@/lib/cart/cart-line-id-cache';
import {
  normalizeProductCustomizations,
  serializeProductCustomizations,
} from '@/lib/cart/customizations';

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

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof ApiError) {
    const apiData = (error.data as { detail?: string; message?: string } | null) ?? null;
    return {
      name: error.name,
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      detail: apiData?.detail ?? apiData?.message ?? null,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return error as Record<string, unknown>;
  }

  return { message: String(error) };
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

function buildProductCustomizationKey(item: CartItem): string {
  const normalized = normalizeProductCustomizations(item.customizations);
  return `${item.variant.product.id}::${serializeProductCustomizations(normalized)}`;
}

async function deleteMatchingLineOnServer(
  item: CartItem,
  preferredServerItemId?: string
): Promise<void> {
  try {
    if (preferredServerItemId) {
      await apiClient.delete(`/api/v1/cart/items/${preferredServerItemId}`);
      invalidateCommerceBootstrapAfterCartMutation();
      return;
    }

    const response = await apiClient.get<{ cart: Cart | null }>('/api/v1/cart');
    const serverCart = response.cart;
    if (!serverCart) {
      return;
    }

    const lineKey = buildCartLineRemovalKey(item);
    const productCustomizationKey = buildProductCustomizationKey(item);
    const matches = serverCart.items.filter(
      (serverItem) =>
        (buildCartLineRemovalKey(serverItem) === lineKey ||
          buildProductCustomizationKey(serverItem) === productCustomizationKey) &&
        !isOptimisticCartItemId(serverItem.id)
    );

    if (matches.length === 0) {
      return;
    }

    await Promise.all(
      matches.map(async (match) => {
        await apiClient.delete(`/api/v1/cart/items/${match.id}`);
      })
    );
    invalidateCommerceBootstrapAfterCartMutation();
  } catch (error: unknown) {
    if (isCartItemNotFoundError(error)) {
      return;
    }
    logger.warn('Background cart line delete failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
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
    void deleteMatchingLineOnServer(itemToRemove, cachedLine?.cartItemId);
    return;
  }

  try {
    await apiClient.delete(`/api/v1/cart/items/${itemId}`);
    invalidateCommerceBootstrapAfterCartMutation();
  } catch (error: unknown) {
    if (isCartItemNotFoundError(error)) {
      logger.debug('Cart item already removed', { itemId });
      return;
    }

    logger.error('Error removing item', {
      itemId,
      error: serializeError(error),
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
    await apiClient.patch(`/api/v1/cart/items/${itemId}`, { quantity });
    invalidateCommerceBootstrapAfterCartMutation();
  } catch (error: unknown) {
    await fetchCart();
    publishCartForceReload();

    if (isCartItemNotFoundError(error)) {
      return;
    }

    const errorObj = error as { detail?: string; message?: string };
    logger.error('Error updating quantity', {
      itemId,
      error: serializeError(error),
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

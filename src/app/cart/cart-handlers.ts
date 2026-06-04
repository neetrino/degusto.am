import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import { logger } from '../../lib/utils/logger';
import type { Cart, CartItem } from './types';
import { publishCartUpdated, publishCartForceReload } from '../../lib/cart/cart-events';

/** Item already removed server-side (e.g. duplicate minus click after optimistic delete). */
function isCartItemNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 404) {
    return true;
  }
  const errorObj = error as { status?: number };
  return errorObj.status === 404;
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
  const itemToRemove = cart.items.find(item => item.id === itemId);
  if (!itemToRemove) return;

  const updatedItems = cart.items.filter(item => item.id !== itemId);
  const newItemsCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
  const updatedTotals = calculateCartTotals(updatedItems, cart.totals);

  setCart({
    ...cart,
    items: updatedItems,
    totals: updatedTotals,
    itemsCount: newItemsCount,
  });
  publishCartUpdated(newItemsCount, updatedTotals.total);

  try {
    await apiClient.delete(`/api/v1/cart/items/${itemId}`);
  } catch (error: unknown) {
    if (isCartItemNotFoundError(error)) {
      logger.debug('Cart item already removed', { itemId });
      await fetchCart();
      return;
    }

    logger.error('Error removing item', { error, itemId });
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

  const cartItem = cart?.items.find(item => item.id === itemId);
  if (!cartItem) return;

  if (cartItem.variant.stock !== undefined && quantity > cartItem.variant.stock) {
    alert(`Մատչելի քանակը ${cartItem.variant.stock} հատ է: Դուք չեք կարող ավելացնել ավելի շատ քանակ:`);
    return;
  }

  if (cart) {
    const updatedItems = cart.items.map(item =>
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
    publishCartUpdated(newItemsCount, updatedTotals.total);
  }

  try {
    await apiClient.patch(`/api/v1/cart/items/${itemId}`, { quantity });
  } catch (error: unknown) {
    await fetchCart();
    publishCartForceReload();

    if (isCartItemNotFoundError(error)) {
      return;
    }

    const errorObj = error as { detail?: string; message?: string };
    logger.error('Error updating quantity', { error, itemId });

    const errorMessage = errorObj?.detail || errorObj?.message || t('common.messages.failedToUpdateQuantity');
    if (errorMessage.includes('stock') || errorMessage.includes('exceeds')) {
      alert(t('common.alerts.stockInsufficient').replace('{message}', errorMessage));
    } else {
      alert(errorMessage);
    }
  }
}

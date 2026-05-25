import { apiClient } from '../../lib/api-client';
import { logger } from '../../lib/utils/logger';
import type { Cart, CartItem } from './types';
import { CART_KEY } from './constants';
import { publishCartUpdated, publishCartForceReload } from '../../lib/cart/cart-events';
import {
  buildCustomizationLineKey,
  normalizeProductCustomizations,
} from '../../lib/cart/customizations';

/**
 * Guest cart item
 */
interface GuestCartItem {
  lineId?: string;
  productId: string;
  productSlug?: string;
  variantId: string;
  quantity: number;
  price?: number;
  customizations?: {
    additions?: string;
    exclusions?: string;
  };
}


/**
 * Parse item ID to extract productId and lineId
 */
function parseItemId(itemId: string): { productId: string; lineId: string } | null {
  const separatorIndex = itemId.indexOf(':');
  if (separatorIndex <= 0 || separatorIndex >= itemId.length - 1) {
    return null;
  }
  return {
    productId: itemId.slice(0, separatorIndex),
    lineId: itemId.slice(separatorIndex + 1),
  };
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
 * Remove item from guest cart in localStorage
 */
function removeFromGuestCart(itemId: string): void {
  if (typeof window === 'undefined') return;

  const parsed = parseItemId(itemId);
  if (!parsed) return;

  const stored = localStorage.getItem(CART_KEY);
  const guestCart: GuestCartItem[] = stored ? JSON.parse(stored) : [];
  
  const updatedCart = guestCart.filter(
    (item) => {
      const lineId = item.lineId || buildCustomizationLineKey(
        item.variantId,
        normalizeProductCustomizations(item.customizations)
      );
      return !(item.productId === parsed.productId && lineId === parsed.lineId);
    }
  );

  const itemsCount = updatedCart.reduce((sum, item) => sum + item.quantity, 0);
  const total = updatedCart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
  publishCartUpdated(itemsCount, total);
}

/**
 * Update item quantity in guest cart in localStorage
 */
function updateGuestCartQuantity(itemId: string, quantity: number): void {
  if (typeof window === 'undefined') return;

  const parsed = parseItemId(itemId);
  if (!parsed) return;

  const stored = localStorage.getItem(CART_KEY);
  const guestCart: GuestCartItem[] = stored ? JSON.parse(stored) : [];
  
  const item = guestCart.find(
    (entry) => {
      const lineId = entry.lineId || buildCustomizationLineKey(
        entry.variantId,
        normalizeProductCustomizations(entry.customizations)
      );
      return entry.productId === parsed.productId && lineId === parsed.lineId;
    }
  );
  
  if (item) {
    item.quantity = quantity;
    const itemsCount = guestCart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);
    const total = guestCart.reduce((sum, cartItem) => sum + (cartItem.price || 0) * cartItem.quantity, 0);
    localStorage.setItem(CART_KEY, JSON.stringify(guestCart));
    publishCartUpdated(itemsCount, total);
  }
}

/**
 * Handle remove item from cart
 */
export async function handleRemoveItem(
  itemId: string,
  cart: Cart,
  isLoggedIn: boolean,
  setCart: (cart: Cart | null) => void,
  fetchCart: () => Promise<void>
): Promise<void> {
  const itemToRemove = cart.items.find(item => item.id === itemId);
  if (!itemToRemove) return;

  // Calculate new totals
  const updatedItems = cart.items.filter(item => item.id !== itemId);
  const newItemsCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
  const updatedTotals = calculateCartTotals(updatedItems, cart.totals);

  // Update UI immediately (optimistic update)
  setCart({
    ...cart,
    items: updatedItems,
    totals: updatedTotals,
    itemsCount: newItemsCount,
  });
  publishCartUpdated(newItemsCount, updatedTotals.total);

  try {
    if (!isLoggedIn) {
      removeFromGuestCart(itemId);
      return;
    }

    // For logged-in users, delete from API
    await apiClient.delete(`/api/v1/cart/items/${itemId}`);
  } catch (error: unknown) {
    logger.error('Error removing item', { error, itemId });
    // Revert optimistic update on error
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
  isLoggedIn: boolean,
  setCart: (cart: Cart | null) => void,
  fetchCart: () => Promise<void>,
  t: (key: string) => string
): Promise<void> {
  if (quantity < 1) {
    if (cart) {
      await handleRemoveItem(itemId, cart, isLoggedIn, setCart, fetchCart);
    }
    return;
  }

  // Find the cart item to check stock
  const cartItem = cart?.items.find(item => item.id === itemId);
  if (!cartItem) return;

  if (cartItem.variant.stock !== undefined) {
    if (quantity > cartItem.variant.stock) {
      alert(`Մատչելի քանակը ${cartItem.variant.stock} հատ է: Դուք չեք կարող ավելացնել ավելի շատ քանակ:`);
      return;
    }
  }

  // Optimistic update: update UI immediately
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
    if (!isLoggedIn) {
      if (typeof window === 'undefined') return;

      // Check stock for guest cart
      if (cartItem.variant.stock !== undefined && quantity > cartItem.variant.stock) {
        alert(`Մատչելի քանակը ${cartItem.variant.stock} հատ է: Դուք չեք կարող ավելացնել ավելի շատ քանակ:`);
        // Revert optimistic update
        await fetchCart();
        return;
      }
      
      updateGuestCartQuantity(itemId, quantity);
      return;
    }

    // For logged-in users, update via API
    await apiClient.patch(
      `/api/v1/cart/items/${itemId}`,
      { quantity }
    );
  } catch (error: unknown) {
    const errorObj = error as { detail?: string; message?: string };
    logger.error('Error updating quantity', { error, itemId });
    // Revert optimistic update on error
    await fetchCart();
    publishCartForceReload();
    
    // Show user-friendly error message
    const errorMessage = errorObj?.detail || errorObj?.message || t('common.messages.failedToUpdateQuantity');
    if (errorMessage.includes('stock') || errorMessage.includes('exceeds')) {
      alert(t('common.alerts.stockInsufficient').replace('{message}', errorMessage));
    } else {
      alert(errorMessage);
    }
  }
}





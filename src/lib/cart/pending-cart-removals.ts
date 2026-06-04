import type { Cart, CartItem } from '@/app/cart/types';
import {
  buildCustomizationLineKey,
  normalizeProductCustomizations,
  type ProductCustomizations,
} from './customizations';

const removedLineKeys = new Set<string>();

type CartLineRef = {
  variant: { id: string };
  customizations?: ProductCustomizations;
};

/** Optimistic cart rows use synthetic ids; server rows use cuid. */
export function isOptimisticCartItemId(itemId: string): boolean {
  return itemId.includes('::');
}

export function buildCartLineRemovalKey(item: CartLineRef): string {
  const normalized = normalizeProductCustomizations(item.customizations);
  return buildCustomizationLineKey(item.variant.id, normalized);
}

export function markCartLineRemoved(item: CartLineRef): void {
  removedLineKeys.add(buildCartLineRemovalKey(item));
}

export function clearCartLineRemoved(item: CartLineRef): void {
  removedLineKeys.delete(buildCartLineRemovalKey(item));
}

function isCartLineRemoved(item: CartLineRef): boolean {
  return removedLineKeys.has(buildCartLineRemovalKey(item));
}

export function filterRemovedCartItems<T extends CartItem>(items: T[]): T[] {
  return items.filter((item) => !isCartLineRemoved(item));
}

/** Drop user-removed lines when merging server cart into local state. */
export function applyRemovedLinesFilter(cart: Cart | null): Cart | null {
  if (!cart) {
    return null;
  }

  const items = filterRemovedCartItems(cart.items);
  if (items.length === cart.items.length) {
    return cart;
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    ...cart,
    items,
    itemsCount,
    totals: {
      ...cart.totals,
      subtotal,
      total: subtotal + cart.totals.tax + cart.totals.shipping - cart.totals.discount,
    },
  };
}

import type { Cart, CartItem } from '@/app/cart/types';
import {
  buildCustomizationLineKey,
  serializeProductCustomizations,
  normalizeProductCustomizations,
  type ProductCustomizations,
} from './customizations';

const removedLineKeys = new Set<string>();
const removedProductLineKeys = new Set<string>();

type CartLineRef = {
  variant: { id: string; product?: { id: string } };
  customizations?: ProductCustomizations;
  productId?: string;
};

/** Optimistic cart rows use synthetic ids; server rows use cuid. */
export function isOptimisticCartItemId(itemId: string): boolean {
  return itemId.includes('::');
}

export function buildCartLineRemovalKey(item: CartLineRef): string {
  const normalized = normalizeProductCustomizations(item.customizations);
  return buildCustomizationLineKey(item.variant.id, normalized);
}

function buildProductCustomizationRemovalKey(
  productId: string,
  customizations?: ProductCustomizations
): string {
  const normalized = normalizeProductCustomizations(customizations);
  return `${productId}::${serializeProductCustomizations(normalized)}`;
}

function resolveProductId(item: CartLineRef): string | null {
  if (item.productId && item.productId.trim().length > 0) {
    return item.productId;
  }
  const variantProductId = item.variant.product?.id;
  if (variantProductId && variantProductId.trim().length > 0) {
    return variantProductId;
  }
  return null;
}

export function markCartLineRemoved(item: CartLineRef): void {
  removedLineKeys.add(buildCartLineRemovalKey(item));
  const productId = resolveProductId(item);
  if (productId) {
    removedProductLineKeys.add(
      buildProductCustomizationRemovalKey(productId, item.customizations)
    );
  }
}

export function clearCartLineRemoved(item: CartLineRef): void {
  removedLineKeys.delete(buildCartLineRemovalKey(item));
  const productId = resolveProductId(item);
  if (productId) {
    removedProductLineKeys.delete(
      buildProductCustomizationRemovalKey(productId, item.customizations)
    );
  }
}

function isCartLineRemoved(item: CartLineRef): boolean {
  if (removedLineKeys.has(buildCartLineRemovalKey(item))) {
    return true;
  }
  const productId = resolveProductId(item);
  if (!productId) {
    return false;
  }
  return removedProductLineKeys.has(
    buildProductCustomizationRemovalKey(productId, item.customizations)
  );
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

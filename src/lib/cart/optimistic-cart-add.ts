import type { Cart, CartItem } from '@/app/cart/types';
import {
  buildCustomizationLineKey,
  normalizeProductCustomizations,
  type ProductCustomizations,
} from './customizations';
import { clearCartLineRemoved } from './pending-cart-removals';
import type { CartUpdatedDetail } from './cart-events';

export interface CartAddSnapshot {
  productId: string;
  productSlug: string;
  variantId: string;
  title: string;
  image?: string | null;
  price: number;
  quantity: number;
  customizations?: ProductCustomizations;
}

function buildOptimisticItemId(snapshot: CartAddSnapshot): string {
  const lineKey = buildCustomizationLineKey(snapshot.variantId, snapshot.customizations);
  return `${snapshot.productId}:${lineKey}`;
}

function matchesCartLine(
  item: CartItem,
  snapshot: CartAddSnapshot
): boolean {
  if (
    item.variant.id !== snapshot.variantId ||
    item.variant.product.id !== snapshot.productId
  ) {
    return false;
  }
  const itemLineKey = buildCustomizationLineKey(item.variant.id, item.customizations);
  const snapshotLineKey = buildCustomizationLineKey(snapshot.variantId, snapshot.customizations);
  return itemLineKey === snapshotLineKey;
}

function buildCartItemFromSnapshot(snapshot: CartAddSnapshot): CartItem {
  const lineTotal = snapshot.price * snapshot.quantity;
  return {
    id: buildOptimisticItemId(snapshot),
    customizations: snapshot.customizations,
    variant: {
      id: snapshot.variantId,
      sku: '',
      product: {
        id: snapshot.productId,
        title: snapshot.title,
        slug: snapshot.productSlug,
        image: snapshot.image ?? null,
      },
    },
    quantity: snapshot.quantity,
    price: snapshot.price,
    total: lineTotal,
  };
}

function recalculateCartTotals(items: CartItem[]): Cart['totals'] {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  return {
    subtotal,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: subtotal,
    currency: 'AMD',
  };
}

/** Merge an optimistic add into cart state for instant drawer feedback. */
export function applyOptimisticCartAdd(
  cart: Cart | null,
  snapshot: CartAddSnapshot
): Cart {
  clearCartLineRemoved({
    variant: { id: snapshot.variantId },
    customizations: normalizeProductCustomizations(snapshot.customizations),
  });

  const optimisticId = buildOptimisticItemId(snapshot);
  const baseCart: Cart = cart ?? {
    id: 'optimistic-cart',
    items: [],
    totals: recalculateCartTotals([]),
    itemsCount: 0,
  };

  const existingIndex = baseCart.items.findIndex((item) => matchesCartLine(item, snapshot));

  let nextItems: CartItem[];
  if (existingIndex >= 0) {
    nextItems = baseCart.items.map((item, index) => {
      if (index !== existingIndex) {
        return item;
      }
      const quantity = item.quantity + snapshot.quantity;
      return {
        ...item,
        quantity,
        total: item.price * quantity,
      };
    });
  } else {
    nextItems = [...baseCart.items, buildCartItemFromSnapshot(snapshot)];
  }

  const itemsCount = nextItems.reduce((sum, item) => sum + item.quantity, 0);
  return {
    ...baseCart,
    items: nextItems,
    itemsCount,
    totals: recalculateCartTotals(nextItems),
  };
}

export function snapshotFromCartDetail(detail: CartUpdatedDetail): CartAddSnapshot | null {
  return detail.addedItem ?? null;
}

export interface CartLineConfirmation {
  productId: string;
  previousVariantId: string;
  variantId: string;
  customizations?: ProductCustomizations;
  serverItemId: string;
  quantity: number;
  price: number;
}

function findConfirmedLineIndex(
  items: CartItem[],
  confirmation: CartLineConfirmation
): number {
  const normalizedCustomizations = normalizeProductCustomizations(confirmation.customizations);
  const previousLineKey = buildCustomizationLineKey(
    confirmation.previousVariantId,
    normalizedCustomizations
  );
  const optimisticId = `${confirmation.productId}:${previousLineKey}`;

  return items.findIndex(
    (item) =>
      item.id === optimisticId ||
      (item.variant.product.id === confirmation.productId &&
        buildCustomizationLineKey(item.variant.id, item.customizations) === previousLineKey)
  );
}

/** Swap optimistic cart line ids with the server row after POST /cart/items succeeds. */
export function confirmOptimisticCartLine(
  cart: Cart | null,
  confirmation: CartLineConfirmation
): Cart | null {
  if (!cart) {
    return cart;
  }

  const itemIndex = findConfirmedLineIndex(cart.items, confirmation);
  if (itemIndex < 0) {
    return cart;
  }

  const duplicateServerIndex = cart.items.findIndex(
    (item, index) => index !== itemIndex && item.id === confirmation.serverItemId
  );

  const confirmedItem = {
    ...cart.items[itemIndex],
    id: confirmation.serverItemId,
    quantity: confirmation.quantity,
    price: confirmation.price,
    total: confirmation.price * confirmation.quantity,
    variant: {
      ...cart.items[itemIndex].variant,
      id: confirmation.variantId,
    },
  };

  let nextItems: CartItem[];
  if (duplicateServerIndex >= 0) {
    // Keep one canonical server row and drop the optimistic duplicate line.
    nextItems = cart.items
      .map((item, index) => {
        if (index === duplicateServerIndex) {
          return {
            ...item,
            quantity: confirmation.quantity,
            price: confirmation.price,
            total: confirmation.price * confirmation.quantity,
            variant: {
              ...item.variant,
              id: confirmation.variantId,
            },
          };
        }
        return item;
      })
      .filter((_, index) => index !== itemIndex);
  } else {
    nextItems = cart.items.map((item, index) => {
      if (index !== itemIndex) {
        return item;
      }
      return confirmedItem;
    });
  }

  const itemsCount = nextItems.reduce((sum, item) => sum + item.quantity, 0);
  return {
    ...cart,
    items: nextItems,
    itemsCount,
    totals: recalculateCartTotals(nextItems),
  };
}

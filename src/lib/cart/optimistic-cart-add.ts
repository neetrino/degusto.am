import type { Cart, CartItem } from '@/app/cart/types';
import { buildCustomizationLineKey } from './customizations';
import type { CartUpdatedDetail } from './cart-events';

export interface CartAddSnapshot {
  productId: string;
  productSlug: string;
  variantId: string;
  title: string;
  image?: string | null;
  price: number;
  quantity: number;
}

function buildOptimisticItemId(snapshot: CartAddSnapshot): string {
  const lineKey = buildCustomizationLineKey(snapshot.variantId, undefined);
  return `${snapshot.productId}:${lineKey}`;
}

function buildCartItemFromSnapshot(snapshot: CartAddSnapshot): CartItem {
  const lineTotal = snapshot.price * snapshot.quantity;
  return {
    id: buildOptimisticItemId(snapshot),
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
  const optimisticId = buildOptimisticItemId(snapshot);
  const baseCart: Cart = cart ?? {
    id: 'optimistic-cart',
    items: [],
    totals: recalculateCartTotals([]),
    itemsCount: 0,
  };

  const existingIndex = baseCart.items.findIndex(
    (item) =>
      item.variant.id === snapshot.variantId &&
      item.variant.product.id === snapshot.productId
  );

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

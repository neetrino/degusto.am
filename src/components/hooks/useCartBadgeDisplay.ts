'use client';

import { useEffect, useState } from 'react';
import { useCartDrawer } from '../cart-drawer/cart-drawer-context';
import { readCartSummaryCache } from '@/lib/cartSummaryCache';
import {
  applyCartBadgeFromDetail,
  parseCartUpdatedDetail,
} from '@/lib/cart/cart-events';

export type CartBadgeSnapshot = {
  cartCount: number;
  cartTotal: number;
};

function readCachedBadgeSnapshot(): CartBadgeSnapshot {
  const cached = readCartSummaryCache();
  return {
    cartCount: cached?.itemsCount ?? 0,
    cartTotal: cached?.total ?? 0,
  };
}

function readCartBadgeSnapshot(cart: ReturnType<typeof useCartDrawer>['cart']): CartBadgeSnapshot {
  return {
    cartCount: cart?.itemsCount ?? 0,
    cartTotal: cart?.totals?.total ?? 0,
  };
}

/**
 * Header/mobile cart badge counts — cart drawer is source of truth after load;
 * cache and cart-updated events cover the loading and optimistic-add windows.
 */
export function useCartBadgeDisplay(): CartBadgeSnapshot {
  const { cart, cartLoading, isCartResolved } = useCartDrawer();
  const [eventBadge, setEventBadge] = useState<CartBadgeSnapshot | null>(null);
  const [cachedBadge, setCachedBadge] = useState<CartBadgeSnapshot | null>(null);

  useEffect(() => {
    setCachedBadge(readCachedBadgeSnapshot());
  }, []);

  useEffect(() => {
    const handleCartUpdated = (event: Event) => {
      const detail = parseCartUpdatedDetail(event);
      applyCartBadgeFromDetail(detail, (cartCount, cartTotal) => {
        setEventBadge({ cartCount, cartTotal });
      });
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    return () => window.removeEventListener('cart-updated', handleCartUpdated);
  }, []);

  useEffect(() => {
    if (isCartResolved && !cartLoading) {
      setEventBadge(null);
    }
  }, [cart, cartLoading, isCartResolved]);

  if (eventBadge) {
    return eventBadge;
  }

  if (!isCartResolved || cartLoading) {
    const live = readCartBadgeSnapshot(cart);
    return {
      cartCount: (cachedBadge?.cartCount ?? 0) > 0 ? (cachedBadge?.cartCount ?? 0) : live.cartCount,
      cartTotal: (cachedBadge?.cartCount ?? 0) > 0 ? (cachedBadge?.cartTotal ?? 0) : live.cartTotal,
    };
  }

  return readCartBadgeSnapshot(cart);
}

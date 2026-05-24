'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth/AuthContext';
import { apiClient } from '../../lib/api-client';
import { CART_KEY, getWishlistCount } from '../../lib/storageCounts';
import { readCartSummaryCache, writeCartSummaryCache } from '../../lib/cartSummaryCache';

interface GuestCartItem {
  quantity?: number;
  price?: number;
}

interface CartResponse {
  cart?: {
    itemsCount?: number;
    totals?: {
      total?: number;
    };
  };
}

type CartUpdatedDetail = {
  optimisticAdd?: { quantity?: number; price?: number };
  itemsCount?: number;
  total?: number;
  forceReload?: boolean;
};

/**
 * Cart and wishlist item counts for mobile navigation badges (bottom bar).
 */
export function useMobileNavBadgeCounts(): { cartCount: number; wishlistCount: number } {
  const { isLoggedIn } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const cached = readCartSummaryCache();
    if (cached) {
      setCartCount(cached.itemsCount);
    }

    const readGuestCart = () => {
      try {
        const stored = localStorage.getItem(CART_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        const items = Array.isArray(parsed) ? (parsed as GuestCartItem[]) : [];
        const itemsCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
        setCartCount(itemsCount);
        writeCartSummaryCache(itemsCount, total);
      } catch {
        setCartCount(0);
        writeCartSummaryCache(0, 0);
      }
    };

    const fetchCart = async () => {
      if (!isLoggedIn) {
        readGuestCart();
        return;
      }

      try {
        const response = await apiClient.get<CartResponse>('/api/v1/cart');
        const itemsCount = response.cart?.itemsCount || 0;
        const total = response.cart?.totals?.total || 0;
        setCartCount(itemsCount);
        writeCartSummaryCache(itemsCount, total);
      } catch {
        setCartCount(0);
        writeCartSummaryCache(0, 0);
      }
    };

    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdatedDetail>).detail;

      if (detail?.forceReload) {
        void fetchCart();
        return;
      }

      if (detail?.optimisticAdd) {
        const nextQuantity = detail.optimisticAdd.quantity ?? 1;
        const nextPrice = detail.optimisticAdd.price ?? 0;
        setCartCount((prevCount) => {
          const nextCount = prevCount + nextQuantity;
          const cached = readCartSummaryCache();
          const prevTotal = cached?.total ?? 0;
          writeCartSummaryCache(nextCount, prevTotal + nextPrice * nextQuantity);
          return nextCount;
        });
        return;
      }

      if (detail?.itemsCount !== undefined && detail?.total !== undefined) {
        setCartCount(detail.itemsCount);
        writeCartSummaryCache(detail.itemsCount, detail.total);
        return;
      }

      void fetchCart();
    };

    const refreshWishlistCount = () => {
      setWishlistCount(getWishlistCount());
    };

    refreshWishlistCount();
    void fetchCart();

    const handleWishlistUpdated = () => {
      refreshWishlistCount();
    };

    const handleAuthForCartAndWishlist = () => {
      refreshWishlistCount();
      void fetchCart();
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('auth-updated', handleAuthForCartAndWishlist);
    window.addEventListener('wishlist-updated', handleWishlistUpdated);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('auth-updated', handleAuthForCartAndWishlist);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
    };
  }, [isLoggedIn]);

  return { cartCount, wishlistCount };
}

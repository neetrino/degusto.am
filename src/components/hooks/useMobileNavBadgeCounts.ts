'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
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

const HOME_PATH = '/';
const HOME_DEFER_CART_FETCH_IDLE_TIMEOUT_MS = 2000;

/** Runs after idle (or timeout fallback); returns cancel for effect cleanup. */
function scheduleIdleCartFetch(run: () => void): () => void {
  let cancelled = false;
  const invoke = () => {
    if (!cancelled) {
      run();
    }
  };

  if (typeof window.requestIdleCallback === 'function') {
    const idleId = window.requestIdleCallback(invoke, { timeout: HOME_DEFER_CART_FETCH_IDLE_TIMEOUT_MS });
    return () => {
      cancelled = true;
      window.cancelIdleCallback(idleId);
    };
  }

  const timeoutId = window.setTimeout(invoke, HOME_DEFER_CART_FETCH_IDLE_TIMEOUT_MS);
  return () => {
    cancelled = true;
    window.clearTimeout(timeoutId);
  };
}

/**
 * Cart and wishlist item counts for mobile navigation badges (bottom bar).
 */
export function useMobileNavBadgeCounts(): { cartCount: number; wishlistCount: number } {
  const pathname = usePathname() ?? '';
  const isHomePath = pathname === HOME_PATH;
  const { isLoggedIn } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const cached = readCartSummaryCache();
    if (cached) {
      setCartCount(cached.itemsCount);
    }

    let cancelDeferredCartFetch: (() => void) | undefined;

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

    const runInitialCartFetch = () => {
      if (isHomePath && isLoggedIn) {
        cancelDeferredCartFetch = scheduleIdleCartFetch(() => {
          void fetchCart();
        });
        return;
      }
      void fetchCart();
    };

    const handleCartUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CartUpdatedDetail>).detail;

      if (detail?.forceReload) {
        cancelDeferredCartFetch?.();
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

      cancelDeferredCartFetch?.();
      void fetchCart();
    };

    const refreshWishlistCount = () => {
      setWishlistCount(getWishlistCount());
    };

    refreshWishlistCount();
    runInitialCartFetch();

    const handleWishlistUpdated = () => {
      refreshWishlistCount();
    };

    const handleAuthForCartAndWishlist = () => {
      refreshWishlistCount();
      cancelDeferredCartFetch?.();
      void fetchCart();
    };

    window.addEventListener('cart-updated', handleCartUpdated);
    window.addEventListener('auth-updated', handleAuthForCartAndWishlist);
    window.addEventListener('wishlist-updated', handleWishlistUpdated);

    return () => {
      cancelDeferredCartFetch?.();
      window.removeEventListener('cart-updated', handleCartUpdated);
      window.removeEventListener('auth-updated', handleAuthForCartAndWishlist);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated);
    };
  }, [isLoggedIn, isHomePath]);

  return { cartCount, wishlistCount };
}

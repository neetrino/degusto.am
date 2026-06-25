'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type { Cart } from '@/app/cart/types';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { useCartLiveSync } from '@/lib/cart/use-cart-live-sync';
import { readCartSummaryCache } from '@/lib/cartSummaryCache';
import { cartHasVisibleItems } from '@/lib/cart/cart-summary-sync';

export type CartDrawerContextValue = {
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  isCartDrawerOpen: boolean;
  cart: Cart | null;
  setCart: Dispatch<SetStateAction<Cart | null>>;
  cartLoading: boolean;
  isCartResolved: boolean;
  setCartLoading: Dispatch<SetStateAction<boolean>>;
  reloadCart: (options?: { silent?: boolean; forceDirect?: boolean }) => Promise<void>;
  scheduleReconcile: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | undefined>(undefined);

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) {
    throw new Error('useCartDrawer must be used within CartDrawerProvider');
  }
  return ctx;
}

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { t } = useTranslation();

  const {
    cart,
    setCart,
    cartLoading,
    isCartResolved,
    setCartLoading,
    reloadCart,
    scheduleReconcile,
    cartRef,
  } = useCartLiveSync({
    isLoggedIn,
    isAuthLoading,
    t,
  });

  const openCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(true);
    const cached = readCartSummaryCache();
    if ((cached?.itemsCount ?? 0) > 0 && !cartHasVisibleItems(cartRef.current)) {
      void reloadCart({ silent: true });
    }
  }, [cartRef, reloadCart]);

  const closeCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(false);
  }, []);

  const value = useMemo(
    (): CartDrawerContextValue => ({
      openCartDrawer,
      closeCartDrawer,
      isCartDrawerOpen,
      cart,
      setCart,
      cartLoading,
      isCartResolved,
      setCartLoading,
      reloadCart,
      scheduleReconcile,
    }),
    [
      cart,
      cartLoading,
      closeCartDrawer,
      isCartDrawerOpen,
      isCartResolved,
      openCartDrawer,
      reloadCart,
      scheduleReconcile,
      setCart,
      setCartLoading,
    ]
  );

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
}

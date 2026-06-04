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

export type CartDrawerContextValue = {
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  isCartDrawerOpen: boolean;
  cart: Cart | null;
  setCart: Dispatch<SetStateAction<Cart | null>>;
  cartLoading: boolean;
  setCartLoading: Dispatch<SetStateAction<boolean>>;
  reloadCart: (options?: { silent?: boolean }) => Promise<void>;
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
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();

  const openCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(true);
  }, []);

  const {
    cart,
    setCart,
    cartLoading,
    setCartLoading,
    reloadCart,
    scheduleReconcile,
  } = useCartLiveSync({
    isLoggedIn,
    t,
    onOptimisticAdd: openCartDrawer,
  });

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
      setCartLoading,
      reloadCart,
      scheduleReconcile,
    }),
    [
      cart,
      cartLoading,
      closeCartDrawer,
      isCartDrawerOpen,
      openCartDrawer,
      reloadCart,
      scheduleReconcile,
      setCart,
      setCartLoading,
    ]
  );

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
}

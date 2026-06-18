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
import {
  useCartLiveSync,
  type CartSyncState,
  type StableCartState,
} from '@/lib/cart/use-cart-live-sync';

export type CartDrawerContextValue = {
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  isCartDrawerOpen: boolean;
  cart: Cart | null;
  cartState: StableCartState;
  setCart: Dispatch<SetStateAction<Cart | null>>;
  cartLoading: boolean;
  cartSyncState: CartSyncState;
  isCartResolved: boolean;
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
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();

  const {
    cart,
    cartState,
    setCart,
    cartLoading,
    cartSyncState,
    isCartResolved,
    setCartLoading,
    reloadCart,
    scheduleReconcile,
  } = useCartLiveSync({
    isLoggedIn,
    isAuthLoading,
  });

  const openCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(true);
  }, []);

  const closeCartDrawer = useCallback(() => {
    setIsCartDrawerOpen(false);
  }, []);

  const value = useMemo(
    (): CartDrawerContextValue => ({
      openCartDrawer,
      closeCartDrawer,
      isCartDrawerOpen,
      cart,
      cartState,
      setCart,
      cartLoading,
      cartSyncState,
      isCartResolved,
      setCartLoading,
      reloadCart,
      scheduleReconcile,
    }),
    [
      cart,
      cartState,
      cartLoading,
      cartSyncState,
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

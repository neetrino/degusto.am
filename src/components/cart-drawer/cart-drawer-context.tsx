'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type CartDrawerContextValue = {
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  isCartDrawerOpen: boolean;
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
    }),
    [closeCartDrawer, isCartDrawerOpen, openCartDrawer]
  );

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>;
}

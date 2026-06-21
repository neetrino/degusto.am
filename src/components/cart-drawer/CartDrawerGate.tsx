'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useCartDrawer } from './cart-drawer-context';

const LazyCartDrawer = dynamic(
  () => import('./CartDrawer').then((module) => module.CartDrawer),
  { ssr: false }
);

export function CartDrawerGate() {
  const { isCartDrawerOpen } = useCartDrawer();
  const [shouldMountDrawer, setShouldMountDrawer] = useState(false);

  useEffect(() => {
    if (isCartDrawerOpen) {
      setShouldMountDrawer(true);
    }
  }, [isCartDrawerOpen]);

  if (!shouldMountDrawer) {
    return null;
  }

  return <LazyCartDrawer />;
}

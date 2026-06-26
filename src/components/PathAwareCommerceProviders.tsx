'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { WishlistIdsProvider } from '@/lib/wishlist/WishlistIdsProvider';
import { CartDrawerProvider } from '@/components/cart-drawer/cart-drawer-context';
import { CartDrawer } from '@/components/cart-drawer/CartDrawer';
import { isAdminAppPath } from '@/lib/routing/is-admin-app-path';

type PathAwareCommerceProvidersProps = {
  children: ReactNode;
};

/**
 * Mounts cart / wishlist only on storefront routes.
 * Admin panels never need these APIs and should not pay their latency cost.
 */
export function PathAwareCommerceProviders({ children }: PathAwareCommerceProvidersProps) {
  const pathname = usePathname();
  const isAdminApp = isAdminAppPath(pathname);

  if (isAdminApp) {
    return children;
  }

  return (
    <WishlistIdsProvider>
      <CartDrawerProvider>
        {children}
        <CartDrawer />
      </CartDrawerProvider>
    </WishlistIdsProvider>
  );
}

'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { WishlistIdsProvider } from '../lib/wishlist/WishlistIdsProvider';
import { ToastContainer } from './Toast';
import { LanguageHtmlUpdater } from './LanguageHtmlUpdater';
import { CartDrawerProvider } from './cart-drawer/cart-drawer-context';
import { CartDrawer } from './cart-drawer/CartDrawer';
import { DisableMobileZoomGuard } from './mobile/DisableMobileZoomGuard';
import { MobilePageScrollCache } from './mobile/MobilePageScrollCache';
import { MobileRoutePrefetcher } from './mobile/MobileRoutePrefetcher';
import { PdpChromeProvider } from '../app/products/[slug]/pdp-chrome-context';

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WishlistIdsProvider>
      <PdpChromeProvider>
      <CartDrawerProvider>
        <DisableMobileZoomGuard />
        <MobileRoutePrefetcher />
        <MobilePageScrollCache />
        <LanguageHtmlUpdater />
        {children}
        <CartDrawer />
        <ToastContainer />
      </CartDrawerProvider>
      </PdpChromeProvider>
      </WishlistIdsProvider>
    </AuthProvider>
  );
}

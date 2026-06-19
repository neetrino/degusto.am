'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '../lib/auth/AuthContext';
import { WishlistIdsProvider } from '../lib/wishlist/WishlistIdsProvider';
import { CompareIdsProvider } from '../lib/compare/CompareIdsProvider';
import { ToastContainer } from './Toast';
import { LanguageHtmlUpdater } from './LanguageHtmlUpdater';
import { CartDrawerProvider } from './cart-drawer/cart-drawer-context';
import { DisableMobileZoomGuard } from './mobile/DisableMobileZoomGuard';
import { MobilePageScrollCache } from './mobile/MobilePageScrollCache';
import { MobileRoutePrefetcher } from './mobile/MobileRoutePrefetcher';
import { PdpChromeProvider } from '../app/products/[slug]/pdp-chrome-context';
import { NotFoundPageProvider } from './errors/not-found-page.context';
import { LanguageProvider } from '../lib/i18n-client';

const CartDrawer = dynamic(
  () => import('./cart-drawer/CartDrawer').then((module) => module.CartDrawer),
  { ssr: false }
);

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
    <AuthProvider>
      <WishlistIdsProvider>
      <CompareIdsProvider>
      <PdpChromeProvider>
      <NotFoundPageProvider>
      <CartDrawerProvider>
        <DisableMobileZoomGuard />
        <MobileRoutePrefetcher />
        <MobilePageScrollCache />
        <LanguageHtmlUpdater />
        {children}
        <CartDrawer />
        <ToastContainer />
      </CartDrawerProvider>
      </NotFoundPageProvider>
      </PdpChromeProvider>
      </CompareIdsProvider>
      </WishlistIdsProvider>
    </AuthProvider>
    </LanguageProvider>
  );
}

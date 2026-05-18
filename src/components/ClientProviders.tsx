'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { ToastContainer } from './Toast';
import { LanguageHtmlUpdater } from './LanguageHtmlUpdater';
import { CartDrawerProvider } from './cart-drawer/cart-drawer-context';
import { CartDrawer } from './cart-drawer/CartDrawer';
import { DisableMobileZoomGuard } from './mobile/DisableMobileZoomGuard';

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartDrawerProvider>
        <DisableMobileZoomGuard />
        <LanguageHtmlUpdater />
        {children}
        <CartDrawer />
        <ToastContainer />
      </CartDrawerProvider>
    </AuthProvider>
  );
}

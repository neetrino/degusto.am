'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { ToastContainer } from './Toast';
import { LanguageHtmlUpdater } from './LanguageHtmlUpdater';
import { CartDrawerProvider } from './cart-drawer/cart-drawer-context';
import { CartDrawer } from './cart-drawer/CartDrawer';

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartDrawerProvider>
        <LanguageHtmlUpdater />
        {children}
        <CartDrawer />
        <ToastContainer />
      </CartDrawerProvider>
    </AuthProvider>
  );
}

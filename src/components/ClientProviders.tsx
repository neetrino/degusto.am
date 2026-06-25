'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth/AuthContext';
import { ToastContainer } from './Toast';
import { LanguageHtmlUpdater } from './LanguageHtmlUpdater';
import { DisableMobileZoomGuard } from './mobile/DisableMobileZoomGuard';
import { MobilePageScrollCache } from './mobile/MobilePageScrollCache';
import { MobileRoutePrefetcher } from './mobile/MobileRoutePrefetcher';
import { PdpChromeProvider } from '../app/products/[slug]/pdp-chrome-context';
import { NotFoundPageProvider } from './errors/not-found-page.context';
import { PathAwareCommerceProviders } from './PathAwareCommerceProviders';

/**
 * ClientProviders component
 * Wraps the app with all client-side providers (Auth, Theme, etc.)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PathAwareCommerceProviders>
        <PdpChromeProvider>
          <NotFoundPageProvider>
            <DisableMobileZoomGuard />
            <MobileRoutePrefetcher />
            <MobilePageScrollCache />
            <LanguageHtmlUpdater />
            {children}
            <ToastContainer />
          </NotFoundPageProvider>
        </PdpChromeProvider>
      </PathAwareCommerceProviders>
    </AuthProvider>
  );
}

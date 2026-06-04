import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { LOCKED_MOBILE_VIEWPORT } from '@/constants/viewport';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { ConditionalHeader } from '../components/ConditionalHeader';
import { ConditionalFooter } from '../components/ConditionalFooter';
import { ConditionalMobileBottomNav } from '../components/ConditionalMobileBottomNav';
import { LayoutShell } from '../components/LayoutShell';
import { MobileStorefrontChrome } from '../components/mobile/MobileStorefrontChrome';
import { PRIMARY_LOCALE } from '@/lib/i18n/locale';
import { getSiteMetadataCopy } from '@/lib/i18n/metadata';

export const viewport: Viewport = LOCKED_MOBILE_VIEWPORT;

const defaultSiteMetadata = getSiteMetadataCopy(PRIMARY_LOCALE);

export const metadata: Metadata = {
  title: defaultSiteMetadata.title,
  description: defaultSiteMetadata.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" style={{ backgroundColor: '#ffffff' }}>
      <body
        className="font-sans text-gray-900 antialiased min-h-full"
        style={{ backgroundColor: '#ffffff' }}
      >
        <Suspense fallback={null}>
          <ClientProviders>
            <LayoutShell>
              <ConditionalHeader />
              <main className="flex-1 w-full">
                <MobileStorefrontChrome>{children}</MobileStorefrontChrome>
              </main>
              <ConditionalFooter />
              <ConditionalMobileBottomNav />
            </LayoutShell>
          </ClientProviders>
        </Suspense>
      </body>
    </html>
  );
}


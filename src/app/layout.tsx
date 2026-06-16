import React from 'react';
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
const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';
const metadataBase = (() => {
  try {
    return new URL(rawAppUrl);
  } catch {
    return new URL('http://localhost:3000');
  }
})();

export const metadata: Metadata = {
  title: defaultSiteMetadata.title,
  description: defaultSiteMetadata.description,
  metadataBase,
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
      </body>
    </html>
  );
}


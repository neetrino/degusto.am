import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { ConditionalHeader } from '../components/ConditionalHeader';
import { ConditionalFooter } from '../components/ConditionalFooter';
import { ConditionalMobileBottomNav } from '../components/ConditionalMobileBottomNav';
import { LayoutShell } from '../components/LayoutShell';
import { cookies } from 'next/headers';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getSiteMetadataCopy } from '@/lib/i18n/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const copy = getSiteMetadataCopy(locale);

  return {
    title: copy.title,
    description: copy.description,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" style={{ backgroundColor: '#ffffff' }}>
      <head>
        <link rel="preload" as="image" href="/api/r2/hero/20260512-tOKhBzyB6u.png" />
      </head>
      <body
        className="font-sans text-gray-900 antialiased min-h-full"
        style={{ backgroundColor: '#ffffff' }}
      >
        <Suspense fallback={null}>
          <ClientProviders>
            <LayoutShell>
              <ConditionalHeader />
              <main className="flex-1 w-full">
                {children}
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


import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { ConditionalHeader } from '../components/ConditionalHeader';
import { ConditionalFooter } from '../components/ConditionalFooter';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shop - Professional E-commerce',
  description: 'Modern e-commerce platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" style={{ backgroundColor: '#f56814' }}>
      <head>
        <link rel="preload" as="image" href="/api/r2/hero/20260512-tOKhBzyB6u.png" />
      </head>
      <body
        className={`${inter.className} text-gray-900 antialiased min-h-full`}
        style={{ backgroundColor: '#f56814' }}
      >
        <Suspense fallback={null}>
          <ClientProviders>
            <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
              <ConditionalHeader />
              <main className="flex-1 w-full">
                {children}
              </main>
              <ConditionalFooter />
            </div>
          </ClientProviders>
        </Suspense>
      </body>
    </html>
  );
}


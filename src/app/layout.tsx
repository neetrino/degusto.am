import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '../components/ClientProviders';
import { ConditionalHeader } from '../components/ConditionalHeader';
import { ConditionalFooter } from '../components/ConditionalFooter';
import { MobileBottomNav } from '../components/MobileBottomNav';

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
    <html lang="en" className="h-full">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased min-h-full`}>
        <Suspense fallback={null}>
          <ClientProviders>
            <div className="flex min-h-screen flex-col pb-16 lg:pb-0">
              <ConditionalHeader />
              <main className="flex-1 w-full">
                {children}
              </main>
              <ConditionalFooter />
              <MobileBottomNav />
            </div>
          </ClientProviders>
        </Suspense>
      </body>
    </html>
  );
}


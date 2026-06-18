'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { UNIVERSAL_HEADER_SPACER_HEIGHT_CLASS } from '@/constants/universal-header-layout';
import { UniversalHeader } from './UniversalHeader';
import { usesCheckoutTabletDesktopLayout } from '../lib/uses-storefront-mobile-chrome';
import { useNotFoundPage } from './errors/not-found-page.context';

export function ConditionalHeader() {
  const pathname = usePathname();
  const isNotFoundPage = useNotFoundPage();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (pathname?.startsWith('/supersudo') || pathname?.startsWith('/admin-mobile')) {
    return null;
  }

  if (pathname === '/') {
    return null;
  }

  const isAboutPage = pathname?.startsWith('/about');
  const universalSpacerClass = isNotFoundPage
    ? 'bg-transparent'
    : isAuthPage
    ? 'bg-[#F66812]'
    : isAboutPage
      ? "bg-[url('/images/about-page-botanical-bg.png')] bg-cover bg-center"
      : 'bg-white';
  const checkoutTabletDesktop = usesCheckoutTabletDesktopLayout(pathname);
  const universalHeaderVisibilityClass = checkoutTabletDesktop ? 'hidden md:block' : 'hidden lg:block';

  return (
    <div className={universalHeaderVisibilityClass}>
      <Suspense fallback={<div className={UNIVERSAL_HEADER_SPACER_HEIGHT_CLASS} aria-hidden />}>
        <UniversalHeader spacerBackgroundClassName={universalSpacerClass} />
      </Suspense>
    </div>
  );
}

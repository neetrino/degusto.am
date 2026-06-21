'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { UNIVERSAL_HEADER_SPACER_HEIGHT_CLASS } from '@/constants/universal-header-layout';
import { UniversalHeader } from './UniversalHeader';
import { usesCheckoutTabletDesktopLayout } from '../lib/uses-storefront-mobile-chrome';
import { useNotFoundPage } from './errors/not-found-page.context';

export function ConditionalHeader() {
  const pathname = usePathname();
  const isNotFoundPage = useNotFoundPage();
  const [isTabletDesktopViewport, setIsTabletDesktopViewport] = useState(false);
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const hideForAdmin = pathname?.startsWith('/supersudo') || pathname?.startsWith('/admin-mobile');
  const hideForHome = pathname === '/';

  const isAboutPage = pathname?.startsWith('/about');
  const universalSpacerClass = isNotFoundPage
    ? 'bg-transparent'
    : isAuthPage
    ? 'bg-[#F66812]'
    : isAboutPage
      ? "bg-[url('/images/about-page-botanical-bg.png')] bg-cover bg-center"
      : 'bg-white';
  const checkoutTabletDesktop = usesCheckoutTabletDesktopLayout(pathname);
  useEffect(() => {
    if (!checkoutTabletDesktop) {
      return;
    }
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const sync = () => {
      setIsTabletDesktopViewport(mediaQuery.matches);
    };
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => {
      mediaQuery.removeEventListener('change', sync);
    };
  }, [checkoutTabletDesktop]);

  if (hideForAdmin || hideForHome) {
    return null;
  }

  if (checkoutTabletDesktop && !isTabletDesktopViewport) {
    return null;
  }

  const universalHeaderVisibilityClass = checkoutTabletDesktop ? 'hidden md:block' : 'hidden lg:block';

  return (
    <div className={universalHeaderVisibilityClass}>
      <Suspense fallback={<div className={UNIVERSAL_HEADER_SPACER_HEIGHT_CLASS} aria-hidden />}>
        <UniversalHeader spacerBackgroundClassName={universalSpacerClass} />
      </Suspense>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { UniversalHeader } from './UniversalHeader';
import { usesStorefrontMobileChrome, usesCheckoutTabletDesktopLayout } from '../lib/uses-storefront-mobile-chrome';

export function ConditionalHeader() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (pathname?.startsWith('/supersudo') || pathname?.startsWith('/admin-mobile')) {
    return null;
  }

  if (pathname === '/') {
    return null;
  }

  const isAboutPage = pathname?.startsWith('/about');
  const universalSpacerClass = isAuthPage
    ? 'bg-[#F66812]'
    : isAboutPage
      ? "bg-[url('/images/about-page-botanical-bg.png')] bg-cover bg-center"
      : 'bg-white';
  const showLegacyMobileHeader = !usesStorefrontMobileChrome(pathname);
  const checkoutTabletDesktop = usesCheckoutTabletDesktopLayout(pathname);
  const universalHeaderVisibilityClass = checkoutTabletDesktop ? 'hidden md:block' : 'hidden lg:block';
  const legacyMobileHeaderVisibilityClass = checkoutTabletDesktop ? 'md:hidden' : 'lg:hidden';

  return (
    <>
      <div className={universalHeaderVisibilityClass}>
        <UniversalHeader spacerBackgroundClassName={universalSpacerClass} />
      </div>
      {showLegacyMobileHeader ? (
        <div className={legacyMobileHeaderVisibilityClass}>
          <Header />
        </div>
      ) : null}
    </>
  );
}

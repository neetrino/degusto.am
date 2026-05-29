'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { UniversalHeader } from './UniversalHeader';
import { usesStorefrontMobileChrome } from '../lib/uses-storefront-mobile-chrome';

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

  return (
    <>
      <div className="hidden lg:block">
        <UniversalHeader spacerBackgroundClassName={universalSpacerClass} />
      </div>
      {showLegacyMobileHeader ? (
        <div className="lg:hidden">
          <Header />
        </div>
      ) : null}
    </>
  );
}

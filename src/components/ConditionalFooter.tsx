'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

/** Footer outer wrapper: brand orange on auth + product detail (matches PDP orange rail). */
const FOOTER_OUTER_ORANGE_CLASS = 'bg-[#F66812]';

export function ConditionalFooter() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProductDetailPage = /^\/products\/[^/]+\/?$/.test(pathname ?? '');
  const isProfilePage = pathname?.startsWith('/profile');
  const isAdminPage = pathname?.startsWith('/supersudo');
  if (pathname === '/') {
    return null;
  }
  if (isAdminPage) {
    return null;
  }
  if (isProfilePage) {
    return (
      <div className="hidden lg:block">
        <Footer outerBackgroundClassName="bg-white" />
      </div>
    );
  }
  return (
    <Footer
      outerBackgroundClassName={isAuthPage || isProductDetailPage ? FOOTER_OUTER_ORANGE_CLASS : 'bg-white'}
    />
  );
}

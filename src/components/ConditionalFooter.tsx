'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

/** Footer outer wrapper: brand orange on auth + product detail (matches PDP orange rail). */
const FOOTER_OUTER_ORANGE_CLASS = 'bg-[#F66812]';

export function ConditionalFooter() {
  const pathname = usePathname();

  if (pathname === '/' || pathname?.startsWith('/supersudo')) {
    return null;
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProductDetailPage = /^\/products\/[^/]+\/?$/.test(pathname ?? '');
  const isProfilePage = pathname?.startsWith('/profile');

  if (isProfilePage) {
    return (
      <div className="hidden lg:block">
        <Footer outerBackgroundClassName="bg-white" />
      </div>
    );
  }

  const backgroundClassName =
    isAuthPage || isProductDetailPage ? FOOTER_OUTER_ORANGE_CLASS : 'bg-white';

  return (
    <div className="hidden lg:block">
      <Footer outerBackgroundClassName={backgroundClassName} />
    </div>
  );
}

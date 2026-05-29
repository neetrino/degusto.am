'use client';

import { usePathname } from 'next/navigation';
import { usePdpChrome } from '../app/products/[slug]/pdp-chrome-context';
import { Footer } from './Footer';

/** Footer outer wrapper: brand orange on auth + loaded PDP (visible in rounded corner gutters). */
const FOOTER_OUTER_ORANGE_CLASS = 'bg-[#F66812]';
const AUTH_FOOTER_BACKGROUND_CLASS = 'bg-[#102313]';

const PRODUCT_DETAIL_PATH = /^\/products\/[^/]+\/?$/;

export function ConditionalFooter() {
  const pathname = usePathname();
  const { isDesktopChromeReady } = usePdpChrome();

  if (pathname === '/' || pathname?.startsWith('/supersudo') || pathname?.startsWith('/admin-mobile')) {
    return null;
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isProductDetailPage = PRODUCT_DETAIL_PATH.test(pathname ?? '');
  const isProfilePage = pathname?.startsWith('/profile');
  const isAboutPage = pathname?.startsWith('/about');

  if (isProfilePage) {
    return (
      <div className="hidden lg:block">
        <Footer outerBackgroundClassName="bg-white" />
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <div className={`hidden lg:block ${AUTH_FOOTER_BACKGROUND_CLASS}`}>
        <Footer outerBackgroundClassName="bg-transparent" />
      </div>
    );
  }

  const useOrangeGutter =
    isProductDetailPage && isDesktopChromeReady;
  const backgroundClassName = useOrangeGutter
    ? FOOTER_OUTER_ORANGE_CLASS
    : isAboutPage
      ? 'bg-[#F2EBDD]'
      : 'bg-white';

  return (
    <div className="hidden lg:block">
      <Footer outerBackgroundClassName={backgroundClassName} />
    </div>
  );
}

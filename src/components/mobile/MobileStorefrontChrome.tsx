'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS } from '@/constants/mobile-figma-storefront';
import {
  usesStorefrontMobileChrome,
  usesStorefrontMobileHeader,
  usesCheckoutTabletDesktopLayout,
} from '../../lib/uses-storefront-mobile-chrome';
import { MobileStorefrontHeader } from './MobileStorefrontHeader';

type MobileStorefrontChromeProps = {
  children: ReactNode;
};

/**
 * Shared mobile storefront shell: orange hero + Figma header + white rounded content surface.
 * Desktop (`lg+`) renders children only (transparent pass-through).
 */
export function MobileStorefrontChrome({ children }: MobileStorefrontChromeProps) {
  const pathname = usePathname();

  if (!usesStorefrontMobileChrome(pathname)) {
    return <>{children}</>;
  }

  const showMobileHeader = usesStorefrontMobileHeader(pathname);
  const checkoutTabletDesktop = usesCheckoutTabletDesktopLayout(pathname);
  const isProfileRoute =
    pathname.startsWith('/profile') || pathname.startsWith('/admin-mobile');

  const checkoutBottomInsetClass = checkoutTabletDesktop
    ? ''
    : MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS;

  const contentSurfaceClass = showMobileHeader
    ? checkoutTabletDesktop
      ? `relative z-10 mt-[87px] flex min-h-0 flex-1 flex-col bg-white px-4 pt-8 ${checkoutBottomInsetClass} md:mt-0 md:flex-none md:rounded-none md:bg-transparent md:px-0 md:pb-0 md:pt-0`
      : `relative z-10 mt-[87px] flex min-h-0 flex-1 flex-col bg-white px-4 pt-8 ${MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS} lg:mt-0 lg:flex-none lg:rounded-none lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0`
    : `relative z-10 flex min-h-0 flex-1 flex-col bg-white px-0 pt-0 ${MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS} lg:flex-none lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0`;

  const outerSurfaceClass = checkoutTabletDesktop
    ? 'md:min-h-0 md:flex-none md:bg-transparent'
    : 'lg:min-h-0 lg:flex-none lg:bg-transparent';

  const decorHiddenClass = checkoutTabletDesktop ? 'md:hidden' : 'lg:hidden';

  const pageBackgroundClass = isProfileRoute
    ? 'bg-white lg:bg-transparent'
    : checkoutTabletDesktop
      ? 'bg-[var(--project-color)] md:bg-transparent'
      : 'bg-[var(--project-color)]';

  return (
    <div className={`flex min-h-screen w-full flex-col ${outerSurfaceClass} ${pageBackgroundClass}`}>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-x-clip">
        {showMobileHeader ? (
          <>
            <div className={`pointer-events-none absolute -left-[210px] -top-[123px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D] ${decorHiddenClass}`} />
            <div className={`pointer-events-none absolute -right-[160px] -top-[184px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D] ${decorHiddenClass}`} />

            <Suspense fallback={null}>
              <div className={decorHiddenClass}>
                <MobileStorefrontHeader />
              </div>
            </Suspense>
          </>
        ) : null}

        <div className={contentSurfaceClass}>{children}</div>
      </div>
    </div>
  );
}

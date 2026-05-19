'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS } from '@/constants/mobile-figma-storefront';
import {
  usesStorefrontMobileChrome,
  usesStorefrontMobileHeader,
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
  const isProfileRoute =
    pathname.startsWith('/profile') || pathname.startsWith('/admin-mobile');

  const contentSurfaceClass = showMobileHeader
    ? `relative z-10 mt-[87px] flex min-h-0 flex-1 flex-col rounded-t-[30px] bg-white px-4 pt-8 ${MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS} lg:mt-0 lg:flex-none lg:rounded-none lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0`
    : `relative z-10 flex min-h-0 flex-1 flex-col bg-white px-0 pt-0 ${MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS} lg:flex-none lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0`;

  return (
    <div
      className={`flex min-h-screen w-full flex-col lg:min-h-0 lg:flex-none lg:bg-transparent ${
        isProfileRoute ? 'bg-white lg:bg-transparent' : 'bg-[var(--project-color)]'
      }`}
    >
      <div className="relative flex min-h-0 flex-1 flex-col overflow-x-clip">
        {showMobileHeader ? (
          <>
            <div className="pointer-events-none absolute -left-[210px] -top-[123px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D] lg:hidden" />
            <div className="pointer-events-none absolute -right-[160px] -top-[184px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D] lg:hidden" />

            <Suspense fallback={null}>
              <MobileStorefrontHeader />
            </Suspense>
          </>
        ) : null}

        <div className={contentSurfaceClass}>{children}</div>
      </div>
    </div>
  );
}

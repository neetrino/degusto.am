'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { usesStorefrontMobileChrome } from '../../lib/uses-storefront-mobile-chrome';
import { MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS } from '@/constants/mobile-figma-storefront';
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--project-color)] lg:min-h-0 lg:flex-none lg:bg-transparent">
      <div className="relative min-h-0 flex-1 overflow-x-clip">
        <div className="pointer-events-none absolute -left-[210px] -top-[123px] h-[434px] w-[418px] rounded-full border-[80px] border-[#3E573D] lg:hidden" />
        <div className="pointer-events-none absolute -right-[160px] -top-[184px] h-[320px] w-[360px] rounded-full border-[70px] border-[#3E573D] lg:hidden" />

        <Suspense fallback={null}>
          <MobileStorefrontHeader />
        </Suspense>

        <div
          className={`relative z-10 mt-[87px] flex-1 rounded-t-[30px] bg-white px-4 pt-8 ${MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS} lg:mt-0 lg:flex-none lg:rounded-none lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

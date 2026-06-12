'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { usesStorefrontMobileChrome } from '../lib/uses-storefront-mobile-chrome';
import { useNotFoundPage } from './errors/not-found-page.context';
import { NOT_FOUND_SURFACE_CLASS } from './errors/not-found-page.constants';

/**
 * Root flex shell: mobile bottom padding for fixed nav when the page does not
 * reserve space itself (home and mobile Figma chrome use `pb-[110px]` on the content surface).
 */
export function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isNotFoundPage = useNotFoundPage();
  const chrome = usesStorefrontMobileChrome(pathname);
  const reserveMobileNavSpace = pathname !== '/' && !chrome;

  return (
    <div
      className={`flex min-h-screen flex-col${isNotFoundPage ? ` ${NOT_FOUND_SURFACE_CLASS}` : ''}${reserveMobileNavSpace ? ' pb-[110px] lg:pb-0' : ''}`}
    >
      {children}
    </div>
  );
}

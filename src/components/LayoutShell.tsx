'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Root flex shell: mobile bottom padding for fixed nav, except on `/` where
 * FigmaHomePageMobile already reserves space (`pb-[110px]` on main).
 */
export function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reserveMobileNavSpace = pathname !== '/';

  return (
    <div
      className={`flex min-h-screen flex-col${reserveMobileNavSpace ? ' pb-16 lg:pb-0' : ''}`}
    >
      {children}
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MOBILE_VIEWPORT_MEDIA_QUERY } from '@/constants/mobile-input';
import {
  readMobileScrollCache,
  writeMobileScrollCache,
} from '@/lib/mobile/mobile-page-scroll-cache';

/**
 * Restores window scroll when returning to a previously visited mobile route.
 * Works together with Next.js client router cache (staleTimes) for native-app tab feel.
 */
export function MobilePageScrollCache(): null {
  const pathname = usePathname() ?? '';
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_MEDIA_QUERY);
    if (!mediaQuery.matches) {
      previousPathRef.current = pathname;
      return;
    }

    const previousPath = previousPathRef.current;
    if (previousPath && previousPath !== pathname) {
      writeMobileScrollCache(previousPath, window.scrollY);
    }

    previousPathRef.current = pathname;

    const savedScrollY = readMobileScrollCache(pathname);
    const restoreScroll = (): void => {
      if (typeof savedScrollY === 'number' && savedScrollY > 0) {
        window.scrollTo(0, savedScrollY);
        return;
      }

      window.scrollTo(0, 0);
    };

    requestAnimationFrame(restoreScroll);
  }, [pathname]);

  return null;
}

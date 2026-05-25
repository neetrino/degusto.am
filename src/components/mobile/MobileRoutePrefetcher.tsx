'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADMIN_MOBILE_ANALYTICS_PATH,
  ADMIN_MOBILE_HUB_PATH,
  ADMIN_MOBILE_ORDERS_PATH,
} from '@/constants/admin-mobile-profile';
import { MOBILE_STOREFRONT_PREFETCH_ROUTES } from '@/constants/mobile-page-cache';
import { MOBILE_VIEWPORT_MEDIA_QUERY } from '@/constants/mobile-input';

const MOBILE_ADMIN_PREFETCH_ROUTES = [
  ADMIN_MOBILE_HUB_PATH,
  ADMIN_MOBILE_ANALYTICS_PATH,
  ADMIN_MOBILE_ORDERS_PATH,
] as const;

/**
 * Warms the client router cache for common mobile destinations on first paint.
 */
export function MobileRoutePrefetcher(): null {
  const router = useRouter();

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_MEDIA_QUERY);

    const prefetchRoutes = (): void => {
      if (!mediaQuery.matches) {
        return;
      }

      for (const route of MOBILE_STOREFRONT_PREFETCH_ROUTES) {
        void router.prefetch(route);
      }

      for (const route of MOBILE_ADMIN_PREFETCH_ROUTES) {
        void router.prefetch(route);
      }
    };

    prefetchRoutes();
    mediaQuery.addEventListener('change', prefetchRoutes);

    return () => {
      mediaQuery.removeEventListener('change', prefetchRoutes);
    };
  }, [router]);

  return null;
}

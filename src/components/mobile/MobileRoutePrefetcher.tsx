'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADMIN_MOBILE_ANALYTICS_PATH,
  ADMIN_MOBILE_HUB_PATH,
  ADMIN_MOBILE_ORDERS_PATH,
} from '@/constants/admin-mobile-profile';
import { STOREFRONT_PREFETCH_ROUTES } from '@/constants/mobile-page-cache';
import { prefetchStorefrontRoute } from '@/lib/routing/prefetch-storefront-route';

const MOBILE_ADMIN_PREFETCH_ROUTES = [
  ADMIN_MOBILE_HUB_PATH,
  ADMIN_MOBILE_ANALYTICS_PATH,
  ADMIN_MOBILE_ORDERS_PATH,
] as const;

/**
 * Warms the client router cache for common storefront destinations on first paint.
 * Runs on all viewports so desktop header / home links navigate instantly too.
 */
export function MobileRoutePrefetcher(): null {
  const router = useRouter();

  useEffect(() => {
    const runPrefetch = () => {
      for (const route of STOREFRONT_PREFETCH_ROUTES) {
        prefetchStorefrontRoute(router, route);
      }

      for (const route of MOBILE_ADMIN_PREFETCH_ROUTES) {
        void router.prefetch(route);
      }
    };

    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(runPrefetch, { timeout: 500 });
      return () => {
        window.cancelIdleCallback?.(idleId);
      };
    }
    const timerId = window.setTimeout(runPrefetch, 200);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [router]);

  return null;
}

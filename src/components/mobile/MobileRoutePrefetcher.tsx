'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ADMIN_MOBILE_ANALYTICS_PATH,
  ADMIN_MOBILE_HUB_PATH,
  ADMIN_MOBILE_ORDERS_PATH,
} from '@/constants/admin-mobile-profile';
import { STOREFRONT_IDLE_PREFETCH_ROUTES } from '@/constants/mobile-page-cache';
import { isAdminAppPath } from '@/lib/routing/is-admin-app-path';
import {
  scheduleIdlePrefetch,
  shouldRunBackgroundRoutePrefetch,
} from '@/lib/routing/prefetch-budget';
import { prefetchStorefrontRoute } from '@/lib/routing/prefetch-storefront-route';

const MOBILE_ADMIN_PREFETCH_ROUTES = [
  ADMIN_MOBILE_HUB_PATH,
  ADMIN_MOBILE_ANALYTICS_PATH,
  ADMIN_MOBILE_ORDERS_PATH,
] as const;

let storefrontIdlePrefetchScheduled = false;

/**
 * One-time idle warmup for high-frequency storefront tabs (shop, combo, wishlist, profile).
 * Pointer/hover prefetch on links remains the primary path for other destinations.
 */
export function MobileRoutePrefetcher(): null {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isAdminAppPath(pathname) || storefrontIdlePrefetchScheduled) {
      return;
    }
    if (!shouldRunBackgroundRoutePrefetch()) {
      return;
    }

    storefrontIdlePrefetchScheduled = true;

    scheduleIdlePrefetch(() => {
      for (const route of STOREFRONT_IDLE_PREFETCH_ROUTES) {
        if (route === pathname) {
          continue;
        }
        prefetchStorefrontRoute(router, route, {
          prefetchMenuProducts: false,
          prefetchProductBundle: false,
        });
      }

      if (pathname.startsWith('/admin-mobile')) {
        for (const route of MOBILE_ADMIN_PREFETCH_ROUTES) {
          if (route !== pathname) {
            void router.prefetch(route);
          }
        }
      }
    });
  }, [pathname, router]);

  return null;
}

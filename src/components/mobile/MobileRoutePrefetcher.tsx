'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  useEffect(() => {
    const currentPath = pathname ?? '';
    const shouldSkipWarmup =
      currentPath === '/checkout' ||
      currentPath.startsWith('/checkout/') ||
      currentPath.startsWith('/orders/');
    const isProductPage = currentPath.startsWith('/products/');

    if (shouldSkipWarmup) {
      return;
    }

    const runPrefetch = () => {
      for (const route of STOREFRONT_PREFETCH_ROUTES) {
        const skipMenuProductsJson =
          isProductPage ||
          (route === '/shop' && (pathname === '/shop' || pathname?.startsWith('/shop?'))) ||
          (route === '/combo' && (pathname === '/combo' || pathname?.startsWith('/combo?')));
        prefetchStorefrontRoute(router, route, {
          prefetchMenuProducts: !skipMenuProductsJson,
        });
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
  }, [pathname, router]);

  return null;
}

'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { prefetchStorefrontRoute } from '@/lib/routing/prefetch-storefront-route';

/** Prefetch routes on mount and on first pointer/touch/focus (Header fast-nav pattern). */
export function useRoutePrefetch(hrefs: readonly string[]) {
  const router = useRouter();

  const prefetch = useCallback(
    (href: string) => {
      if (!href) {
        return;
      }
      prefetchStorefrontRoute(router, href);
    },
    [router]
  );

  useEffect(() => {
    for (const href of hrefs) {
      prefetch(href);
    }
  }, [hrefs, prefetch]);

  const getPrefetchHandlers = useCallback(
    (href: string) => ({
      onMouseEnter: () => prefetch(href),
      onTouchStart: () => prefetch(href),
      onPointerDown: () => prefetch(href),
      onFocus: () => prefetch(href),
    }),
    [prefetch]
  );

  return { prefetch, getPrefetchHandlers };
}

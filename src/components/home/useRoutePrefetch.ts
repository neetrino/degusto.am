'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { prefetchStorefrontRoute } from '@/lib/routing/prefetch-storefront-route';

const PREFETCH_HOVER_DELAY_MS = 120;
const PREFETCH_IDLE_DELAY_MS = 180;

/** Prefetch routes on mount and on first pointer/touch/focus (Header fast-nav pattern). */
export function useRoutePrefetch(hrefs: readonly string[]) {
  const router = useRouter();
  const prefetchTimersRef = useRef<Map<string, number>>(new Map());

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
    const runIdlePrefetch = () => {
      for (const href of hrefs) {
        prefetch(href);
      }
    };
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(runIdlePrefetch, {
        timeout: PREFETCH_IDLE_DELAY_MS,
      });
      return () => {
        window.cancelIdleCallback?.(idleId);
      };
    }
    const timerId = window.setTimeout(runIdlePrefetch, PREFETCH_IDLE_DELAY_MS);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hrefs, prefetch]);

  const schedulePrefetch = useCallback(
    (href: string) => {
      if (!href) {
        return;
      }
      const prefetchTimers = prefetchTimersRef.current;
      const existing = prefetchTimers.get(href);
      if (existing) {
        window.clearTimeout(existing);
      }
      const timerId = window.setTimeout(() => {
        prefetch(href);
        prefetchTimers.delete(href);
      }, PREFETCH_HOVER_DELAY_MS);
      prefetchTimers.set(href, timerId);
    },
    [prefetch]
  );

  const getPrefetchHandlers = useCallback(
    (href: string) => ({
      onMouseEnter: () => schedulePrefetch(href),
      onTouchStart: () => prefetch(href),
      onPointerDown: () => prefetch(href),
      onFocus: () => schedulePrefetch(href),
      onMouseLeave: () => {
        const prefetchTimers = prefetchTimersRef.current;
        const timerId = prefetchTimers.get(href);
        if (timerId) {
          window.clearTimeout(timerId);
          prefetchTimers.delete(href);
        }
      },
    }),
    [prefetch, schedulePrefetch]
  );

  return { prefetch, getPrefetchHandlers };
}

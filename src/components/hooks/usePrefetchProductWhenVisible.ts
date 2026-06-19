'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { prefetchProductRoute } from '@/lib/products/prefetch-product-route';

const VIEWPORT_PREFETCH_ROOT_MARGIN = '280px';
const MAX_VIEWPORT_PREFETCHES_PER_PAGE = 2;
let viewportPrefetchCount = 0;

/**
 * Prefetch PDP once when the card enters (or nears) the viewport.
 */
export function usePrefetchProductWhenVisible(slug: string): (node: HTMLElement | null) => void {
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prefetchedRef = useRef(false);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  return useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = null;

      if (!node || prefetchedRef.current) {
        return;
      }

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting || prefetchedRef.current) {
            return;
          }
          const connection =
            typeof navigator !== 'undefined' && 'connection' in navigator
              ? (navigator.connection as { saveData?: boolean } | undefined)
              : undefined;
          if (connection?.saveData) {
            observerRef.current?.disconnect();
            observerRef.current = null;
            return;
          }
          if (viewportPrefetchCount >= MAX_VIEWPORT_PREFETCHES_PER_PAGE) {
            observerRef.current?.disconnect();
            observerRef.current = null;
            return;
          }
          prefetchedRef.current = true;
          viewportPrefetchCount += 1;
          prefetchProductRoute(router, slug);
          observerRef.current?.disconnect();
          observerRef.current = null;
        },
        { rootMargin: VIEWPORT_PREFETCH_ROOT_MARGIN }
      );

      observerRef.current.observe(node);
    },
    [router, slug]
  );
}

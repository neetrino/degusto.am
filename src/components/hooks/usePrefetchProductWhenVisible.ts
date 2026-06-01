'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { prefetchProductRoute } from '@/lib/products/prefetch-product-route';

const VIEWPORT_PREFETCH_ROOT_MARGIN = '280px';

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
          prefetchedRef.current = true;
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

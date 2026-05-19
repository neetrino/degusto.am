'use client';

import { useState, useEffect, useCallback } from 'react';

const DEFAULT_ROOT_MARGIN = '240px';

/**
 * Fires once when the observed element enters (or nears) the viewport.
 */
export function useLazyInView(rootMargin: string = DEFAULT_ROOT_MARGIN) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  const ref = useCallback((element: HTMLElement | null) => {
    setNode(element);
  }, []);

  useEffect(() => {
    if (!node || inView) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, inView, rootMargin]);

  return { ref, inView };
}

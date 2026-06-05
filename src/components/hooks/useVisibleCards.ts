'use client';

import { useState, useEffect } from 'react';
import { STOREFRONT_DESKTOP_MAX_WIDTH_PX } from '@/constants/storefront-desktop-layout';

function resolveVisibleCards(width: number): number {
  if (width < 640) {
    return 2;
  }
  if (width < 1024) {
    return 2;
  }
  if (width < 1280) {
    return 3;
  }
  if (width < STOREFRONT_DESKTOP_MAX_WIDTH_PX) {
    return 4;
  }
  /** Figma node 10:1975 — five product cards across. */
  return 5;
}

/**
 * Hook for determining number of visible cards based on screen size
 * @returns Number of visible cards
 */
export function useVisibleCards() {
  /** Stable SSR/first-paint value; updated after mount from viewport width. */
  const [visibleCards, setVisibleCards] = useState(2);

  useEffect(() => {
    const updateVisibleCards = () => {
      setVisibleCards(resolveVisibleCards(window.innerWidth));
    };

    updateVisibleCards();
    window.addEventListener('resize', updateVisibleCards);
    return () => window.removeEventListener('resize', updateVisibleCards);
  }, []);

  return visibleCards;
}




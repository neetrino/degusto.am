'use client';

import { useState, useEffect } from 'react';

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
  return 4;
}

/**
 * Hook for determining number of visible cards based on screen size
 * @returns Number of visible cards
 */
export function useVisibleCards() {
  const [visibleCards, setVisibleCards] = useState(() =>
    typeof window === 'undefined' ? 2 : resolveVisibleCards(window.innerWidth),
  );

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




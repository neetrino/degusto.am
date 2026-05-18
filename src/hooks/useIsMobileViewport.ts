'use client';

import { useSyncExternalStore } from 'react';
import { MOBILE_VIEWPORT_MEDIA_QUERY } from '@/constants/mobile-input';

function subscribe(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_MEDIA_QUERY);
  mediaQuery.addEventListener('change', onStoreChange);
  return () => mediaQuery.removeEventListener('change', onStoreChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(MOBILE_VIEWPORT_MEDIA_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/** True when viewport is below the `lg` breakpoint (mobile / tablet portrait layouts). */
export function useIsMobileViewport(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

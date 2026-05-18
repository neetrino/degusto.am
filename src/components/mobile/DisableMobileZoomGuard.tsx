'use client';

import { useEffect } from 'react';
import { MOBILE_VIEWPORT_MEDIA_QUERY } from '@/constants/mobile-input';

const GESTURE_EVENTS = ['gesturestart', 'gesturechange', 'gestureend'] as const;
const NON_PASSIVE: AddEventListenerOptions = { passive: false };

function preventDefault(event: Event): void {
  event.preventDefault();
}

function preventPinchZoom(event: TouchEvent): void {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}

/**
 * Extra mobile-only guards when viewport meta alone is bypassed (e.g. iOS gesture zoom).
 */
export function DisableMobileZoomGuard(): null {
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_MEDIA_QUERY);

    const enable = (): void => {
      for (const name of GESTURE_EVENTS) {
        document.addEventListener(name, preventDefault, NON_PASSIVE);
      }
      document.addEventListener('touchmove', preventPinchZoom, NON_PASSIVE);
    };

    const disable = (): void => {
      for (const name of GESTURE_EVENTS) {
        document.removeEventListener(name, preventDefault);
      }
      document.removeEventListener('touchmove', preventPinchZoom);
    };

    const sync = (): void => {
      disable();
      if (mediaQuery.matches) {
        enable();
      }
    };

    sync();
    mediaQuery.addEventListener('change', sync);

    return () => {
      mediaQuery.removeEventListener('change', sync);
      disable();
    };
  }, []);

  return null;
}

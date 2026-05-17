import type { Viewport } from 'next';

/** Tailwind `lg` — matches {@link MOBILE_VIEWPORT_MEDIA_QUERY} in mobile-input.ts */
export const MOBILE_MAX_WIDTH_PX = 1023;

/**
 * Root viewport: blocks pinch and double-tap zoom on mobile browsers.
 * Desktop browser zoom (e.g. Ctrl +/-) is unaffected.
 */
export const LOCKED_MOBILE_VIEWPORT: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

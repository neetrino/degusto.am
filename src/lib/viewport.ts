/** Matches Tailwind `lg` breakpoint (viewport width below 1024px). */
export const MOBILE_MAX_WIDTH_PX = 1023;

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches;
}

/** Matches Tailwind `lg` breakpoint (viewport width below 1024px). */
export const MOBILE_MAX_WIDTH_PX = 1023;

const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

/** Best-effort mobile detection for SSR when viewport media queries are unavailable. */
export function isMobileUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    return false;
  }
  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`).matches;
}

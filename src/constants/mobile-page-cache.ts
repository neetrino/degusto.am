/** Client router cache TTL (seconds) for dynamic pages — mirrored in next.config.js experimental.staleTimes.dynamic */
export const MOBILE_CLIENT_ROUTER_DYNAMIC_STALE_SECONDS = 300;

/** Client router cache TTL (seconds) for static / prefetched pages */
export const MOBILE_CLIENT_ROUTER_STATIC_STALE_SECONDS = 300;

/** High-frequency tab routes — one-time idle warmup (see MobileRoutePrefetcher). */
export const STOREFRONT_IDLE_PREFETCH_ROUTES = [
  '/shop',
  '/combo',
  '/wishlist',
  '/profile',
] as const;

/** Core storefront routes (includes lower-frequency destinations warmed on pointer/hover). */
export const STOREFRONT_PREFETCH_ROUTES = [
  ...STOREFRONT_IDLE_PREFETCH_ROUTES,
  '/',
  '/login',
] as const;

/** @deprecated Use STOREFRONT_PREFETCH_ROUTES */
export const MOBILE_STOREFRONT_PREFETCH_ROUTES = STOREFRONT_PREFETCH_ROUTES;

export const MOBILE_SCROLL_CACHE_STORAGE_KEY = 'degusto-mobile-scroll-v1';

export const MOBILE_SCROLL_CACHE_MAX_ENTRIES = 24;

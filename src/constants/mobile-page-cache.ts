/** Client router cache TTL (seconds) for dynamic pages — mirrored in next.config.js experimental.staleTimes.dynamic */
export const MOBILE_CLIENT_ROUTER_DYNAMIC_STALE_SECONDS = 300;

/** Client router cache TTL (seconds) for static / prefetched pages */
export const MOBILE_CLIENT_ROUTER_STATIC_STALE_SECONDS = 300;

/** Storefront bottom-nav routes prefetched on mobile for instant tab switching */
export const MOBILE_STOREFRONT_PREFETCH_ROUTES = [
  '/',
  '/shop',
  '/wishlist',
  '/profile',
  '/login',
] as const;

export const MOBILE_SCROLL_CACHE_STORAGE_KEY = 'degusto-mobile-scroll-v1';

export const MOBILE_SCROLL_CACHE_MAX_ENTRIES = 24;

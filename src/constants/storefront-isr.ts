/**
 * Storefront ISR / Data Cache revalidate interval (seconds).
 * Long TTL — freshness comes from admin `revalidateTag` / Redis invalidation, not expiry.
 */
export const STOREFRONT_ISR_REVALIDATE_SECONDS = 86_400;

/**
 * Redis JSON cache TTL for public storefront API payloads (seconds).
 * Pair with explicit invalidation on admin writes.
 */
export const STOREFRONT_REDIS_TTL_SECONDS = 86_400;

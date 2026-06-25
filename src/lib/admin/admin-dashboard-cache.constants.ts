/** Combined dashboard payload cache for admin home UI (ms). */
export const ADMIN_DASHBOARD_CACHE_TTL_MS = 30_000;

/** Recent-orders row count for background poll and shared UI reads. */
export const ADMIN_RECENT_ORDERS_POLL_LIMIT = 8;

/**
 * Inflight dedupe only — completed values are never served from TTL peek/fetch.
 * Use for scheduled polls that must hit the network each tick.
 */
export const INFLIGHT_DEDUPE_ONLY_TTL_MS = 0;

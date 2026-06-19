export const CART_SNAPSHOT_CACHE_KEY = 'shop_cart_snapshot_cache';

/** Drop persisted cart lines so back navigation cannot restore a completed order. */
export function clearCartSnapshotCache(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(CART_SNAPSHOT_CACHE_KEY);
}

'use client';

/**
 * Dispatched when server-side wishlist data may be stale (e.g. id mismatch after fetch).
 * Client toggles stay optimistic and do not emit this event.
 */
export function emitWishlistUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wishlist-updated'));
  }
}

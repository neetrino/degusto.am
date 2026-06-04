'use client';

/** Dispatched when wishlist contents change (after DB sync). */
export function emitWishlistUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wishlist-updated'));
  }
}

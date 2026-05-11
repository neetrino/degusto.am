'use client';

/**
 * Shared storage keys used to keep wishlist, compare and cart data in localStorage.
 */
export const STORAGE_KEYS = {
  wishlist: 'shop_wishlist',
  compare: 'shop_compare',
  cart: 'shop_cart_guest',
} as const;

export const WISHLIST_KEY = STORAGE_KEYS.wishlist;
export const COMPARE_KEY = STORAGE_KEYS.compare;
export const CART_KEY = STORAGE_KEYS.cart;

/**
 * Returns the stored length for an array kept under the provided key.
 */
function getStoredArrayLength(key: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) {
      return 0;
    }

    const cleaned = parsed.filter(
      (value): value is string =>
        typeof value === 'string' &&
        value.trim().length > 0 &&
        value !== 'undefined' &&
        value !== 'null'
    );

    // Heal corrupted legacy values so badges and pages stay in sync.
    if (cleaned.length !== parsed.length) {
      window.localStorage.setItem(key, JSON.stringify(cleaned));
    }

    return cleaned.length;
  } catch {
    return 0;
  }
}

/**
 * Retrieves wishlist items count from localStorage.
 */
export function getWishlistCount(): number {
  return getStoredArrayLength(WISHLIST_KEY);
}

/**
 * Retrieves compare items count from localStorage.
 */
export function getCompareCount(): number {
  return getStoredArrayLength(COMPARE_KEY);
}


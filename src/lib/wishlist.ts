'use client';

import { WISHLIST_KEY } from './storageCounts';

const MAX_WISHLIST_ITEMS = 200;

function normalizeWishlistIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }
    const id = item.trim();
    if (!id) {
      continue;
    }
    unique.add(id);
    if (unique.size >= MAX_WISHLIST_ITEMS) {
      break;
    }
  }

  return Array.from(unique);
}

export function getLocalWishlistIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    return normalizeWishlistIds(JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'));
  } catch {
    return [];
  }
}

export function setLocalWishlistIds(ids: string[]): string[] {
  const normalized = normalizeWishlistIds(ids);
  if (typeof window !== 'undefined') {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function toggleLocalWishlistId(productId: string): string[] {
  const current = getLocalWishlistIds();
  if (current.includes(productId)) {
    return setLocalWishlistIds(current.filter((id) => id !== productId));
  }
  return setLocalWishlistIds([...current, productId]);
}

export function emitWishlistUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('wishlist-updated'));
  }
}

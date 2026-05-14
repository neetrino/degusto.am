import { logger } from './utils/logger';

const CART_SUMMARY_CACHE_KEY = 'shop_cart_summary_cache';

export interface CartSummaryCache {
  itemsCount: number;
  total: number;
}

function isCartSummaryCache(value: unknown): value is CartSummaryCache {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.itemsCount === 'number' && typeof record.total === 'number';
}

/**
 * Reads last known cart count/total from localStorage so the header can paint
 * immediately before `/api/v1/cart` or guest cart parsing finishes.
 */
export function readCartSummaryCache(): CartSummaryCache | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(CART_SUMMARY_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isCartSummaryCache(parsed)) {
      return null;
    }
    return parsed;
  } catch (error: unknown) {
    logger.warn('[cartSummaryCache] Failed to read cache', { error });
    return null;
  }
}

export function writeCartSummaryCache(itemsCount: number, total: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const payload: CartSummaryCache = {
      itemsCount: Number.isFinite(itemsCount) ? itemsCount : 0,
      total: Number.isFinite(total) ? total : 0,
    };
    localStorage.setItem(CART_SUMMARY_CACHE_KEY, JSON.stringify(payload));
  } catch (error: unknown) {
    logger.warn('[cartSummaryCache] Failed to write cache', { error });
  }
}

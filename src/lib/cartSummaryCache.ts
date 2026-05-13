const CART_SUMMARY_CACHE_KEY = 'shop_cart_summary_cache';

interface CartSummaryCache {
  itemsCount: number;
  total: number;
  updatedAt: number;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function readCartSummaryCache(): CartSummaryCache | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CART_SUMMARY_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const maybeSummary = parsed as Partial<CartSummaryCache>;
    if (!isValidNumber(maybeSummary.itemsCount) || !isValidNumber(maybeSummary.total)) {
      return null;
    }

    return {
      itemsCount: maybeSummary.itemsCount,
      total: maybeSummary.total,
      updatedAt: isValidNumber(maybeSummary.updatedAt) ? maybeSummary.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeCartSummaryCache(itemsCount: number, total: number): void {
  if (typeof window === 'undefined') {
    return;
  }

  const safeItemsCount = Number.isFinite(itemsCount) && itemsCount >= 0 ? itemsCount : 0;
  const safeTotal = Number.isFinite(total) && total >= 0 ? total : 0;
  const payload: CartSummaryCache = {
    itemsCount: safeItemsCount,
    total: safeTotal,
    updatedAt: Date.now(),
  };

  window.localStorage.setItem(CART_SUMMARY_CACHE_KEY, JSON.stringify(payload));
}

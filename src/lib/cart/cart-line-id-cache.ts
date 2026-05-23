const CART_LINE_ID_CACHE_KEY = 'shop_cart_line_ids';

interface LineIdEntry {
  cartItemId: string;
  quantity: number;
}

type LineIdCache = Record<string, LineIdEntry>;

function lineKey(productId: string, variantId: string): string {
  return `${productId}:${variantId}`;
}

function readCache(): LineIdCache {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(CART_LINE_ID_CACHE_KEY);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed as LineIdCache;
  } catch {
    return {};
  }
}

function writeCache(cache: LineIdCache): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(CART_LINE_ID_CACHE_KEY, JSON.stringify(cache));
}

export function rememberCartLineId(
  productId: string,
  variantId: string,
  cartItemId: string,
  quantity: number
): void {
  const cache = readCache();
  cache[lineKey(productId, variantId)] = { cartItemId, quantity };
  writeCache(cache);
}

export function getCartLineId(productId: string, variantId: string): LineIdEntry | null {
  return readCache()[lineKey(productId, variantId)] ?? null;
}

export function updateCachedLineQuantity(
  productId: string,
  variantId: string,
  quantity: number
): void {
  const cache = readCache();
  const key = lineKey(productId, variantId);
  const entry = cache[key];
  if (!entry) {
    return;
  }

  cache[key] = { ...entry, quantity };
  writeCache(cache);
}

export function removeCachedLineId(productId: string, variantId: string): void {
  const cache = readCache();
  delete cache[lineKey(productId, variantId)];
  writeCache(cache);
}

export function clearCartLineIdCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(CART_LINE_ID_CACHE_KEY);
}

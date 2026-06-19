import type { WishlistProductSnapshot } from './wishlist-products-cache';
import { getWishlistProductsForIds } from './wishlist-products-cache';

/** Builds an ordered wishlist product list from cache plus in-memory fallbacks. */
export function buildWishlistProductsForIds(
  ids: string[],
  fallbackProducts: WishlistProductSnapshot[] = []
): WishlistProductSnapshot[] {
  if (ids.length === 0) {
    return [];
  }

  const cachedById = new Map(getWishlistProductsForIds(ids).map((product) => [product.id, product]));
  const fallbackById = new Map(fallbackProducts.map((product) => [product.id, product]));

  return ids
    .map((id) => cachedById.get(id) ?? fallbackById.get(id))
    .filter((product): product is WishlistProductSnapshot => product !== undefined);
}

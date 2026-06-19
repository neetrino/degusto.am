import type { MenuCard } from '@/components/home/menu-types';
import type { HomeFeaturedProduct } from '@/components/home/home-page-types';
import { shouldShowMenuCardStrikethroughPrice } from '@/lib/storefront/menu-card-pricing';
import type { WishlistProductSnapshot } from './wishlist-products-cache';

function resolveMenuCardDiscountPercent(card: MenuCard): number | null {
  const calculatedDiscountPercent =
    card.oldPrice > card.price && card.oldPrice > 0
      ? Math.round(((card.oldPrice - card.price) / card.oldPrice) * 100)
      : 0;
  const fallbackDiscountPercent =
    typeof card.discountPercent === 'number' && card.discountPercent > 0
      ? Math.round(card.discountPercent)
      : 0;
  const effectiveDiscountPercent = calculatedDiscountPercent || fallbackDiscountPercent;
  return effectiveDiscountPercent > 0 ? effectiveDiscountPercent : null;
}

/** Maps a storefront menu/home card to a wishlist snapshot for instant render. */
export function menuCardToWishlistSnapshot(
  card: MenuCard,
  title: string
): WishlistProductSnapshot {
  const showStrikethroughPrice = shouldShowMenuCardStrikethroughPrice(card.price, card.oldPrice);

  return {
    id: card.id,
    slug: card.slug,
    title,
    price: card.price,
    originalPrice: null,
    compareAtPrice: showStrikethroughPrice ? card.oldPrice : null,
    discountPercent: resolveMenuCardDiscountPercent(card),
    image: card.image ?? null,
    inStock: card.inStock ?? true,
  };
}

/** Maps a home featured product row to a wishlist snapshot. */
export function homeFeaturedProductToWishlistSnapshot(
  item: HomeFeaturedProduct
): WishlistProductSnapshot {
  const price = item.price ?? 0;
  const oldPrice = item.oldPrice;
  const showStrikethroughPrice =
    oldPrice != null && oldPrice > price && shouldShowMenuCardStrikethroughPrice(price, oldPrice);

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    price,
    originalPrice: null,
    compareAtPrice: showStrikethroughPrice ? oldPrice : null,
    discountPercent:
      typeof item.discountPercent === 'number' && item.discountPercent > 0
        ? Math.round(item.discountPercent)
        : null,
    image: item.image,
    inStock: item.inStock ?? true,
  };
}

type PdpWishlistSnapshotInput = {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  image?: string | null;
  inStock: boolean;
};

/** Maps PDP pricing fields to a wishlist snapshot. */
export function pdpProductToWishlistSnapshot(
  input: PdpWishlistSnapshotInput
): WishlistProductSnapshot {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    price: input.price,
    originalPrice: input.originalPrice,
    compareAtPrice: input.compareAtPrice,
    discountPercent:
      typeof input.discountPercent === 'number' && input.discountPercent > 0
        ? Math.round(input.discountPercent)
        : null,
    image: input.image ?? null,
    inStock: input.inStock,
  };
}

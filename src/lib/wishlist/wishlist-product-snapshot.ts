import type { Product } from '@/app/products/[slug]/types';
import type { HomeFeaturedProduct } from '@/components/home/home-page-types';
import type { MenuCard } from '@/components/home/menu-types';

/** Minimal product fields required to render a wishlist card before the API responds. */
export type WishlistProductSnapshot = {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  image: string | null;
  inStock: boolean;
};

function resolveMenuCardDiscountPercent(card: {
  price: number;
  oldPrice: number;
  discountPercent?: number | null;
}): number | null {
  const calculated =
    card.oldPrice > card.price && card.oldPrice > 0
      ? Math.round(((card.oldPrice - card.price) / card.oldPrice) * 100)
      : 0;
  const fallback =
    typeof card.discountPercent === 'number' && card.discountPercent > 0
      ? Math.round(card.discountPercent)
      : 0;
  const effective = calculated || fallback;
  return effective > 0 ? effective : null;
}

export function buildWishlistSnapshotFromMenuCard(
  card: MenuCard,
  title: string
): WishlistProductSnapshot {
  const discountPercent = resolveMenuCardDiscountPercent(card);
  return {
    id: card.id,
    slug: card.slug,
    title,
    price: card.price,
    originalPrice: card.oldPrice > card.price ? card.oldPrice : null,
    compareAtPrice: null,
    discountPercent,
    image: card.image ?? null,
    inStock: card.inStock ?? true,
  };
}

export function buildWishlistSnapshotFromHomeFeatured(
  item: HomeFeaturedProduct
): WishlistProductSnapshot {
  const price = item.price ?? 0;
  const oldPrice = item.oldPrice;
  const discountPercent =
    typeof item.discountPercent === 'number' && item.discountPercent > 0
      ? Math.round(item.discountPercent)
      : oldPrice != null && oldPrice > price && oldPrice > 0
        ? Math.round(((oldPrice - price) / oldPrice) * 100)
        : null;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    price,
    originalPrice: oldPrice != null && oldPrice > price ? oldPrice : null,
    compareAtPrice: null,
    discountPercent,
    image: item.image,
    inStock: item.inStock ?? true,
  };
}

export function buildWishlistSnapshotFromPdp(
  product: Product,
  options: {
    price: number;
    originalPrice: number | null;
    compareAtPrice: number | null;
    inStock: boolean;
  }
): WishlistProductSnapshot {
  const firstVariant = product.variants[0];
  const image =
    typeof product.media?.[0] === 'string'
      ? product.media[0]
      : product.media?.[0]?.url ?? firstVariant?.imageUrl ?? null;

  const comparePrice =
    options.originalPrice != null && options.originalPrice > options.price
      ? options.originalPrice
      : options.compareAtPrice != null && options.compareAtPrice > options.price
        ? options.compareAtPrice
        : null;

  const discountPercent =
    comparePrice != null && comparePrice > 0
      ? Math.round(((comparePrice - options.price) / comparePrice) * 100)
      : null;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    price: options.price,
    originalPrice: options.originalPrice,
    compareAtPrice: options.compareAtPrice,
    discountPercent,
    image,
    inStock: options.inStock,
  };
}

/** Merge product lists by id; later sources overwrite earlier ones. Order follows `ids`. */
export function mergeWishlistProductsByIds(
  ids: string[],
  ...sources: WishlistProductSnapshot[][]
): WishlistProductSnapshot[] {
  const byId = new Map<string, WishlistProductSnapshot>();
  for (const source of sources) {
    for (const product of source) {
      byId.set(product.id, product);
    }
  }
  return ids
    .map((id) => byId.get(id))
    .filter((product): product is WishlistProductSnapshot => product !== undefined);
}

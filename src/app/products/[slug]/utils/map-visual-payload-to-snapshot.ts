import type { ProductVisualPayload } from '@/lib/services/products-slug/product-visual.service';
import type { Product } from '../types';
import type { ProductVisualSnapshot } from './merge-visual-into-product';

function normalizeMediaUrls(media: Product['media']): string[] {
  if (!Array.isArray(media)) {
    return [];
  }
  return media
    .map((item) => (typeof item === 'string' ? item : item.url ?? ''))
    .filter((url) => url.length > 0);
}

/** Maps cached /visual API payload to client merge snapshot. */
export function mapVisualPayloadToSnapshot(
  payload: ProductVisualPayload
): ProductVisualSnapshot {
  return {
    id: payload.id,
    slug: payload.slug,
    title: payload.title,
    category: payload.category,
    brand: payload.brand,
    price: payload.price,
    oldPrice: payload.oldPrice,
    discountPercent: payload.discountPercent,
    currency: payload.currency,
    inStock: payload.inStock,
    defaultVariantId: payload.defaultVariantId,
    labels: payload.labels,
    galleryImages: payload.galleryImages,
    seo: payload.seo,
  };
}

/** Derives hero snapshot from full product when /visual cache misses. */
export function mapProductToVisualSnapshot(
  product: Product
): ProductVisualSnapshot {
  const firstVariant = product.variants[0] ?? null;
  const oldPrice = firstVariant?.originalPrice ?? firstVariant?.compareAtPrice ?? null;
  const discountPercent =
    product.productDiscount ??
    firstVariant?.productDiscount ??
    product.globalDiscount ??
    firstVariant?.globalDiscount ??
    null;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    category: product.categories?.[0]
      ? {
          slug: product.categories[0].slug,
          title: product.categories[0].title,
        }
      : null,
    brand: null,
    price: firstVariant?.price ?? 0,
    oldPrice,
    discountPercent,
    currency: 'USD',
    inStock: (firstVariant?.stock ?? 0) > 0,
    defaultVariantId: firstVariant?.id ?? null,
    labels: product.labels ?? [],
    galleryImages: normalizeMediaUrls(product.media),
  };
}

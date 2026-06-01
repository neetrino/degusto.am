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
    galleryImages: payload.galleryImages,
    seo: payload.seo,
  };
}

/** Derives hero snapshot from full product when /visual cache misses. */
export function mapProductToVisualSnapshot(
  product: Product
): ProductVisualSnapshot {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    galleryImages: normalizeMediaUrls(product.media),
  };
}

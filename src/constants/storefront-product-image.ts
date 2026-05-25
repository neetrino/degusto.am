import { processImageUrl, type ImageUrlInput } from '@/lib/utils/image-utils';

/** Fallback when a product has no image or loading failed. */
export const STOREFRONT_PRODUCT_IMAGE_PATH = '/images/default-product.png';

/** Resolve a product image URL for storefront display; falls back to default placeholder. */
export function resolveStorefrontProductImage(image: ImageUrlInput): string {
  return processImageUrl(image) ?? STOREFRONT_PRODUCT_IMAGE_PATH;
}

/** First media item from product.media JSON column. */
export function resolveStorefrontProductImageFromMedia(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }
  return processImageUrl(media[0] as ImageUrlInput);
}

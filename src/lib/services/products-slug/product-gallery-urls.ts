import {
  cleanImageUrls,
  normalizeUrlForComparison,
  processImageUrl,
  smartSplitUrls,
  type ImageUrlInput,
} from "../../utils/image-utils";

/** Minimal variant shape for gallery URL merge (matches client useProductImages). */
export interface GalleryVariantInput {
  imageUrl: string | null;
  position?: number;
}

/**
 * Build ordered, deduplicated gallery URLs from product media + variant images.
 * Kept in sync with `useProductImages` client logic.
 */
export function computeProductGalleryUrls(
  media: unknown[] | null | undefined,
  variants: GalleryVariantInput[] | null | undefined
): string[] {
  const mainImages: ImageUrlInput[] = Array.isArray(media)
    ? (media as ImageUrlInput[])
    : [];
  const cleanedMain = cleanImageUrls(mainImages);
  const variantImages: string[] = [];

  if (variants && variants.length > 0) {
    const sortedVariants = [...variants].sort((a, b) => {
      const aPos = typeof a.position === "number" ? a.position : 0;
      const bPos = typeof b.position === "number" ? b.position : 0;
      return aPos - bPos;
    });

    sortedVariants.forEach((v) => {
      if (v.imageUrl) {
        variantImages.push(...smartSplitUrls(v.imageUrl));
      }
    });
  }

  const cleanedVariantImages = cleanImageUrls(variantImages);
  const allImages: string[] = [];
  const seenNormalized = new Set<string>();

  cleanedMain.forEach((img) => {
    const processed = processImageUrl(img) || img;
    const normalized = normalizeUrlForComparison(processed);
    if (!seenNormalized.has(normalized)) {
      allImages.push(img);
      seenNormalized.add(normalized);
    }
  });

  cleanedVariantImages.forEach((img) => {
    const processed = processImageUrl(img) || img;
    const normalized = normalizeUrlForComparison(processed);
    if (!seenNormalized.has(normalized)) {
      allImages.push(img);
      seenNormalized.add(normalized);
    }
  });

  return allImages;
}

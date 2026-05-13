import { useMemo } from 'react';
import {
  processImageUrl,
  smartSplitUrls,
  normalizeUrlForComparison,
  cleanImageUrls,
} from '../../../../lib/utils/image-utils';
import {
  DEMO_PDP_GALLERY_TARGET_COUNT,
  DEMO_PDP_GALLERY_URLS,
} from '../constants/demo-pdp-gallery';
import type { Product } from '../types';

/**
 * Process and combine product images from media and variants
 */
export function useProductImages(product: Product | null): string[] {
  return useMemo(() => {
    if (!product) return [];
    
    const mainImages = Array.isArray(product.media) ? product.media : [];
    const cleanedMain = cleanImageUrls(mainImages);
    const variantImages: string[] = [];
    
    if (product.variants && Array.isArray(product.variants)) {
      const sortedVariants = [...product.variants].sort((a, b) => {
        const aPos = ('position' in a && typeof a.position === 'number') ? a.position : 0;
        const bPos = ('position' in b && typeof b.position === 'number') ? b.position : 0;
        return aPos - bPos;
      });
      
      sortedVariants.forEach((v) => {
        if (v.imageUrl) {
          const urls = smartSplitUrls(v.imageUrl);
          variantImages.push(...urls);
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

    if (
      process.env.NODE_ENV === 'development' &&
      allImages.length < DEMO_PDP_GALLERY_TARGET_COUNT
    ) {
      for (const url of DEMO_PDP_GALLERY_URLS) {
        if (allImages.length >= DEMO_PDP_GALLERY_TARGET_COUNT) break;
        const processed = processImageUrl(url) || url;
        const normalized = normalizeUrlForComparison(processed);
        if (!seenNormalized.has(normalized)) {
          allImages.push(url);
          seenNormalized.add(normalized);
        }
      }
    }

    return allImages;
  }, [product]);
}





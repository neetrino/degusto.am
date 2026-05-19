import type { Product } from '../types';

export interface ProductVisualSnapshot {
  id: string;
  slug: string;
  title: string;
  galleryImages: string[];
  seo?: {
    title: string;
    description: string | null;
  };
}

/**
 * Applies fast /visual payload onto existing PDP state (title + gallery) while details load.
 */
export function mergeVisualIntoProduct(
  previous: Product | null,
  visual: ProductVisualSnapshot
): Product {
  if (!previous) {
    return {
      id: visual.id,
      slug: visual.slug,
      title: visual.title,
      media: visual.galleryImages,
      variants: [],
      seo: visual.seo,
    };
  }

  return {
    ...previous,
    id: visual.id,
    slug: visual.slug,
    title: visual.title,
    media: visual.galleryImages,
  };
}

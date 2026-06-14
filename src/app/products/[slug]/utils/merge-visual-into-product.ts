import type { Product } from '../types';
import type { ProductLabel } from '@/components/ProductLabels';

export interface ProductVisualSnapshot {
  id: string;
  slug: string;
  title: string;
  category?: {
    id?: string;
    slug: string;
    title: string;
  } | null;
  brand?: string | null;
  price?: number;
  oldPrice?: number | null;
  discountPercent?: number | null;
  currency?: string;
  inStock?: boolean;
  defaultVariantId?: string | null;
  labels?: ProductLabel[];
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
  const hasPreviousVariant = Boolean(previous?.variants?.length);
  const visualVariant = {
    id: visual.defaultVariantId ?? 'visual-summary-variant',
    sku: '',
    price: visual.price ?? 0,
    originalPrice: visual.oldPrice ?? null,
    compareAtPrice: visual.oldPrice ?? undefined,
    stock: visual.inStock ? 1 : 0,
    available: visual.inStock ?? true,
    options: [],
    productDiscount: visual.discountPercent ?? null,
    globalDiscount: visual.discountPercent ?? null,
  };

  if (!previous) {
    return {
      id: visual.id,
      slug: visual.slug,
      title: visual.title,
      media: visual.galleryImages,
      variants: [visualVariant],
      labels: visual.labels ?? [],
      categories: visual.category
        ? [
            {
              id: visual.category.id ?? 'visual-category',
              slug: visual.category.slug,
              title: visual.category.title,
            },
          ]
        : [],
      productDiscount: visual.discountPercent ?? null,
      globalDiscount: visual.discountPercent ?? null,
    };
  }

  return {
    ...previous,
    id: visual.id,
    slug: visual.slug,
    title: visual.title,
    media: visual.galleryImages,
    labels: visual.labels ?? previous.labels,
    categories:
      visual.category && visual.category.slug
        ? [
            {
              id: visual.category.id ?? 'visual-category',
              slug: visual.category.slug,
              title: visual.category.title,
            },
            ...(previous.categories ?? []).filter(
              (item) => item.slug !== visual.category?.slug
            ),
          ]
        : previous.categories,
    variants: hasPreviousVariant ? previous.variants : [visualVariant],
    productDiscount: visual.discountPercent ?? previous.productDiscount ?? null,
    globalDiscount: visual.discountPercent ?? previous.globalDiscount ?? null,
  };
}

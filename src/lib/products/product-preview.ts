import type { ProductSummarySnapshot } from '@/lib/products/product-summary-cache';

export interface ProductPreviewInput {
  id: string;
  slug: string;
  title: string;
  image: string | null;
  price: number | null;
  oldPrice?: number | null;
  discount?: number | null;
  rating?: number | null;
  category?: {
    slug?: string | null;
    title?: string | null;
  } | null;
  brand?: string | null;
  currency?: string | null;
  inStock?: boolean | null;
  defaultVariantId?: string | null;
}

function resolveCategory(
  category: ProductPreviewInput['category']
): ProductSummarySnapshot['category'] {
  if (!category?.slug || !category?.title) {
    return null;
  }

  const slug = category.slug.trim();
  const title = category.title.trim();
  if (!slug || !title) {
    return null;
  }

  return { slug, title };
}

export function createProductPreviewSummary(
  preview: ProductPreviewInput
): Omit<ProductSummarySnapshot, 'updatedAt'> {
  return {
    id: preview.id,
    slug: preview.slug,
    title: preview.title,
    image: preview.image,
    price: typeof preview.price === 'number' ? preview.price : 0,
    oldPrice: preview.oldPrice ?? null,
    discount: preview.discount ?? null,
    rating: typeof preview.rating === 'number' ? preview.rating : null,
    category: resolveCategory(preview.category),
    brand: preview.brand ?? null,
    currency: preview.currency ?? 'USD',
    labels: [],
    inStock: preview.inStock ?? true,
    defaultVariantId: preview.defaultVariantId ?? null,
  };
}

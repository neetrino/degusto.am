import { apiClient } from '../../../../lib/api-client';
import type { Product } from '../types';
import {
  mergeVisualIntoProduct,
  type ProductVisualSnapshot,
} from '../utils/merge-visual-into-product';
import {
  getProductSummarySnapshot,
  setProductSummarySnapshot,
} from '@/lib/products/product-summary-cache';

function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'status' in error &&
      Number((error as { status: number }).status) === 404
  );
}

function encodedSlug(slug: string): string {
  return encodeURIComponent(slug.trim());
}

async function fetchVisual(slug: string, lang: string): Promise<ProductVisualSnapshot | null> {
  try {
    return await apiClient.get<ProductVisualSnapshot>(
      `/api/v1/products/${encodedSlug(slug)}/visual`,
      { params: { lang } }
    );
  } catch (error: unknown) {
    if (isNotFoundError(error) && lang !== 'en') {
      return fetchVisual(slug, 'en');
    }
    return null;
  }
}

async function fetchDetails(slug: string, lang: string): Promise<Product> {
  try {
    return await apiClient.get<Product>(`/api/v1/products/${encodedSlug(slug)}/details`, {
      params: { lang },
    });
  } catch (error: unknown) {
    if (isNotFoundError(error) && lang !== 'en') {
      return fetchDetails(slug, 'en');
    }
    throw error;
  }
}

/** Full PDP payload only (skip progressive /visual when SSR already hydrated hero). */
export async function fetchProductDetails(slug: string, lang: string): Promise<Product> {
  try {
    return await fetchDetails(slug, lang);
  } catch (detailsError: unknown) {
    return fetchDetailsLegacy(slug, lang);
  }
}

async function fetchDetailsLegacy(slug: string, lang: string): Promise<Product> {
  return apiClient.get<Product>(`/api/v1/products/${encodedSlug(slug)}`, {
    params: { lang },
  });
}

export interface ProgressiveProductLoadOptions {
  slug: string;
  lang: string;
  previousProduct: Product | null;
  onVisualApplied: (product: Product) => void;
  isStale: () => boolean;
}

/**
 * Client PDP load: /visual first (gallery + title), then /details (full payload).
 */
export async function loadProductProgressive({
  slug,
  lang,
  previousProduct,
  onVisualApplied,
  isStale,
}: ProgressiveProductLoadOptions): Promise<Product> {
  const summary = getProductSummarySnapshot(slug);
  if (!isStale() && summary) {
    onVisualApplied(
      mergeVisualIntoProduct(previousProduct, {
        id: summary.id,
        slug: summary.slug,
        title: summary.title,
        category: summary.category,
        brand: summary.brand,
        price: summary.price,
        oldPrice: summary.oldPrice,
        discountPercent: summary.discount,
        currency: summary.currency,
        inStock: summary.inStock,
        defaultVariantId: summary.defaultVariantId,
        labels: summary.labels,
        galleryImages: summary.image ? [summary.image] : [],
      })
    );
  }

  const visual = await fetchVisual(slug, lang);
  if (!isStale() && visual) {
    onVisualApplied(mergeVisualIntoProduct(previousProduct, visual));
  }

  try {
    const details = await fetchDetails(slug, lang);
    const firstVariant = details.variants[0] ?? null;
    setProductSummarySnapshot({
      id: details.id,
      slug: details.slug,
      title: details.title,
      image:
        typeof details.media?.[0] === 'string'
          ? details.media[0]
          : details.media?.[0]?.url ?? null,
      price: firstVariant?.price ?? 0,
      oldPrice: firstVariant?.originalPrice ?? firstVariant?.compareAtPrice ?? null,
      discount:
        details.productDiscount ??
        firstVariant?.productDiscount ??
        details.globalDiscount ??
        firstVariant?.globalDiscount ??
        null,
      category: details.categories?.[0]
        ? {
            slug: details.categories[0].slug,
            title: details.categories[0].title,
          }
        : null,
      brand: null,
      currency: 'USD',
      labels: details.labels ?? [],
      inStock: (firstVariant?.stock ?? 0) > 0,
      defaultVariantId: firstVariant?.id ?? null,
    });
    return details;
  } catch (detailsError: unknown) {
    try {
      const details = await fetchDetailsLegacy(slug, lang);
      const firstVariant = details.variants[0] ?? null;
      setProductSummarySnapshot({
        id: details.id,
        slug: details.slug,
        title: details.title,
        image:
          typeof details.media?.[0] === 'string'
            ? details.media[0]
            : details.media?.[0]?.url ?? null,
        price: firstVariant?.price ?? 0,
        oldPrice: firstVariant?.originalPrice ?? firstVariant?.compareAtPrice ?? null,
        discount:
          details.productDiscount ??
          firstVariant?.productDiscount ??
          details.globalDiscount ??
          firstVariant?.globalDiscount ??
          null,
        category: details.categories?.[0]
          ? {
              slug: details.categories[0].slug,
              title: details.categories[0].title,
            }
          : null,
        brand: null,
        currency: 'USD',
        labels: details.labels ?? [],
        inStock: (firstVariant?.stock ?? 0) > 0,
        defaultVariantId: firstVariant?.id ?? null,
      });
      return details;
    } catch {
      throw detailsError;
    }
  }
}

export { isNotFoundError };

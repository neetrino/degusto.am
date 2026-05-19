import { apiClient } from '../../../../lib/api-client';
import type { Product } from '../types';
import {
  mergeVisualIntoProduct,
  type ProductVisualSnapshot,
} from '../utils/merge-visual-into-product';

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
  const visual = await fetchVisual(slug, lang);
  if (!isStale() && visual) {
    onVisualApplied(mergeVisualIntoProduct(previousProduct, visual));
  }

  try {
    return await fetchDetails(slug, lang);
  } catch (detailsError: unknown) {
    try {
      return await fetchDetailsLegacy(slug, lang);
    } catch {
      throw detailsError;
    }
  }
}

export { isNotFoundError };

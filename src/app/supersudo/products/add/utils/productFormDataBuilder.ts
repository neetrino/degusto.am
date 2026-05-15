/**
 * Utilities for building product form data
 */

import type { ProductData, Variant, ProductLabel } from '../types';

/** Admin add/edit product form shape (single source for empty + merge-from-API). */
export interface ProductAddFormData {
  title: string;
  slug: string;
  descriptionHtml: string;
  brandIds: string[];
  primaryCategoryId: string;
  categoryIds: string[];
  published: boolean;
  featured: boolean;
  imageUrls: string[];
  featuredImageIndex: number;
  mainProductImage: string;
  variants: Variant[];
  labels: ProductLabel[];
}

/**
 * Fresh empty form — always return new array references so nothing is mutated by reference.
 */
export function getEmptyProductFormData(): ProductAddFormData {
  return {
    title: '',
    slug: '',
    descriptionHtml: '',
    brandIds: [],
    primaryCategoryId: '',
    categoryIds: [],
    published: false,
    featured: false,
    imageUrls: [],
    featuredImageIndex: 0,
    mainProductImage: '',
    variants: [],
    labels: [],
  };
}

/**
 * Builds form data from product data
 */
export function buildFormData(
  product: ProductData,
  normalizedMedia: string[],
  featuredIndexFromApi: number,
  mainProductImage: string,
  mergedVariant: Variant,
): ProductAddFormData {
  const brandIds = product.brandId ? [product.brandId] : [];

  return {
    title: product.title || '',
    slug: product.slug || '',
    descriptionHtml: product.descriptionHtml || '',
    brandIds: brandIds,
    primaryCategoryId: product.primaryCategoryId || '',
    categoryIds: product.categoryIds || [],
    published: product.published || false,
    featured: product.featured || false,
    imageUrls: normalizedMedia,
    featuredImageIndex:
      featuredIndexFromApi >= 0 && featuredIndexFromApi < normalizedMedia.length
        ? featuredIndexFromApi
        : 0,
    mainProductImage:
      normalizedMedia.length > 0 &&
      normalizedMedia[
        featuredIndexFromApi >= 0 && featuredIndexFromApi < normalizedMedia.length
          ? featuredIndexFromApi
          : 0
      ]
        ? normalizedMedia[
            featuredIndexFromApi >= 0 && featuredIndexFromApi < normalizedMedia.length
              ? featuredIndexFromApi
              : 0
          ]
        : mainProductImage || '',
    variants: [mergedVariant],
    labels: (product.labels || []).map((label: ProductLabel) => ({
      id: label.id || '',
      type: label.type || 'text',
      value: label.value || '',
      position: label.position || 'top-left',
      color: label.color || null,
    })),
  };
}

'use client';

import { apiClient } from '@/lib/api-client';
import { getStoredLanguage } from '@/lib/language';
import type { ProductQuickAddPayload } from '@/lib/services/products-slug/product-quick-add.service';

function encodedProductSlug(slug: string): string {
  return encodeURIComponent(slug.trim());
}

/**
 * Lean product/variant read for quick add-to-cart (no full PDP payload).
 */
export async function fetchQuickAddProductBySlug(
  slug: string,
  lang: string = getStoredLanguage()
): Promise<ProductQuickAddPayload> {
  return apiClient.get<ProductQuickAddPayload>(
    `/api/v1/products/${encodedProductSlug(slug)}/quick-add`,
    { params: { lang } }
  );
}

/**
 * Resolves the default quick-add variant id (cheapest published, same as legacy list/PDP sort).
 */
export async function resolveQuickAddVariantId(
  slug: string,
  defaultVariantId?: string | null
): Promise<string | null> {
  if (defaultVariantId) {
    return defaultVariantId;
  }

  const payload = await fetchQuickAddProductBySlug(slug);
  if (payload.defaultVariantId) {
    return payload.defaultVariantId;
  }
  return payload.variants[0]?.id ?? null;
}

'use client';

import { apiClient } from '@/lib/api-client';
import { fetchWithInflightKey } from '@/lib/admin/inflight-get-cache';
import type { LanguageCode } from '@/lib/language';
import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';

export type RelatedProductsPageResponse = {
  data: RelatedCardPayload[];
  meta: { total: number };
};

function buildRelatedProductsInflightKey(
  productSlug: string,
  language: LanguageCode,
  offset: number,
  limit: number
): string {
  return `pdp-related:${productSlug.trim().toLowerCase()}:${language}:${offset}:${limit}`;
}

/** Dedupes concurrent PDP related fetches (Strict Mode, loading + hydrated sections). */
export function fetchRelatedProductsPage(
  productSlug: string,
  language: LanguageCode,
  offset: number,
  limit: number
): Promise<RelatedProductsPageResponse> {
  const encoded = encodeURIComponent(productSlug.trim());
  const key = buildRelatedProductsInflightKey(productSlug, language, offset, limit);

  return fetchWithInflightKey(key, () =>
    apiClient.get<RelatedProductsPageResponse>(`/api/v1/products/${encoded}/related`, {
      params: {
        lang: language,
        offset: String(offset),
        limit: String(limit),
      },
    })
  );
}

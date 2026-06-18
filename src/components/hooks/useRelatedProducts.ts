'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import type { LanguageCode } from '../../lib/language';
import { logger } from '@/lib/utils/logger';
import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';
import { setRelatedProductsSnapshot } from '@/lib/products/related-products-cache';

interface UseRelatedProductsProps {
  categorySlug?: string;
  currentProductId: string;
  language: LanguageCode;
  /** When set (PDP), uses cached `/api/v1/products/[slug]/related` instead of list API. */
  productSlug?: string;
  /** When false, skips fetch until the block is near the viewport. */
  enabled?: boolean;
  /** SSR payload — skips client fetch while language matches `initialLanguage`. */
  initialProducts?: RelatedCardPayload[];
  initialLanguage?: LanguageCode;
}

const RELATED_PRODUCTS_LIMIT = 5;

function mergeUniqueRelatedProducts(items: RelatedCardPayload[]): RelatedCardPayload[] {
  const byId = new Map<string, RelatedCardPayload>();
  for (const item of items) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }
  return Array.from(byId.values());
}

function filterRelatedProducts(
  items: RelatedCardPayload[],
  currentProductId: string
): RelatedCardPayload[] {
  return mergeUniqueRelatedProducts(items)
    .filter((p) => p.id !== currentProductId)
    .slice(0, RELATED_PRODUCTS_LIMIT);
}

/**
 * Hook for fetching related products
 */
export function useRelatedProducts({
  categorySlug,
  currentProductId,
  language,
  productSlug,
  enabled = true,
  initialProducts,
  initialLanguage,
}: UseRelatedProductsProps) {
  const hasServerSnapshot =
    initialProducts != null &&
    initialLanguage != null &&
    language === initialLanguage;

  const [products, setProducts] = useState<RelatedCardPayload[]>(() =>
    hasServerSnapshot ? filterRelatedProducts(initialProducts, currentProductId) : []
  );
  const [loading, setLoading] = useState(!hasServerSnapshot);

  const loadRelatedPage = async (
    encodedSlug: string,
    lang: LanguageCode,
    offset: number
  ): Promise<{ data: RelatedCardPayload[]; meta: { total: number } }> => {
    return apiClient.get<{
      data: RelatedCardPayload[];
      meta: { total: number };
    }>(`/api/v1/products/${encodedSlug}/related`, {
      params: {
        lang,
        offset: String(offset),
        limit: String(RELATED_PRODUCTS_LIMIT),
      },
    });
  };

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchRelatedProducts = async () => {
      const startedAt = Date.now();
      let requestCount = 0;
      try {
        if (!hasServerSnapshot) {
          setLoading(true);
        }

        if (productSlug) {
          const encoded = encodeURIComponent(productSlug.trim());
          if (hasServerSnapshot) {
            const seededSource = initialProducts ?? [];
            setProducts(filterRelatedProducts(seededSource, currentProductId));
            setLoading(false);
            return;
          }

          const firstResponse = await loadRelatedPage(encoded, language, 0);
          requestCount += 1;
          const firstBatch = filterRelatedProducts(firstResponse.data, currentProductId);
          setProducts(firstBatch);
          setRelatedProductsSnapshot(productSlug, language, firstResponse.data);
          return;
        }

        if (hasServerSnapshot) {
          setProducts(filterRelatedProducts(initialProducts, currentProductId));
          setLoading(false);
          return;
        }

        const params: Record<string, string> = {
          limit: '30',
          lang: language,
        };

        if (categorySlug) {
          params.category = categorySlug;
          logger.debug('[RelatedProducts] Fetching related products for category:', categorySlug);
        } else {
          logger.debug('[RelatedProducts] No categorySlug, fetching all products');
        }

        const response = await apiClient.get<{
          data: RelatedCardPayload[];
          meta: {
            total: number;
          };
        }>('/api/v1/products', {
          params,
        });

        setProducts(filterRelatedProducts(response.data, currentProductId));
      } catch (error: unknown) {
        logger.warn('[RelatedProducts] Error fetching related products', {
          error: error instanceof Error ? error.message : String(error),
        });
        setProducts([]);
      } finally {
        setLoading(false);
        logger.debug('[RelatedProducts] Fetch complete', {
          productSlug,
          requestCount,
          durationMs: Date.now() - startedAt,
          hasServerSnapshot,
        });
      }
    };

    void fetchRelatedProducts();
  }, [
    categorySlug,
    currentProductId,
    enabled,
    hasServerSnapshot,
    initialProducts,
    language,
    productSlug,
  ]);

  return { products, loading };
}

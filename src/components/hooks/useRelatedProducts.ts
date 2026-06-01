'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import type { LanguageCode } from '../../lib/language';
import { logger } from '@/lib/utils/logger';
import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';

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

function filterRelatedProducts(
  items: RelatedCardPayload[],
  currentProductId: string
): RelatedCardPayload[] {
  return items.filter((p) => p.id !== currentProductId).slice(0, 10);
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

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (hasServerSnapshot) {
      setProducts(filterRelatedProducts(initialProducts, currentProductId));
      setLoading(false);
      return;
    }

    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);

        if (productSlug) {
          const encoded = encodeURIComponent(productSlug.trim());
          const response = await apiClient.get<{
            data: RelatedCardPayload[];
            meta: { total: number };
          }>(`/api/v1/products/${encoded}/related`, {
            params: { lang: language },
          });
          setProducts(filterRelatedProducts(response.data, currentProductId));
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

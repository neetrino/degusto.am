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

const RELATED_PRODUCTS_LIMIT = 5;
const RELATED_PRODUCTS_MAX = 10;

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

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const fetchRelatedProducts = async () => {
      try {
        if (!hasServerSnapshot) {
          setLoading(true);
        }

        if (productSlug) {
          const encoded = encodeURIComponent(productSlug.trim());
          if (hasServerSnapshot) {
            const seeded = filterRelatedProducts(initialProducts, currentProductId);
            setProducts(seeded);
            setLoading(false);

            let loaded = initialProducts.length;
            while (loaded < RELATED_PRODUCTS_MAX) {
              const nextResponse = await apiClient.get<{
                data: RelatedCardPayload[];
                meta: { total: number };
              }>(`/api/v1/products/${encoded}/related`, {
                params: {
                  lang: language,
                  offset: String(loaded),
                  limit: String(RELATED_PRODUCTS_LIMIT),
                },
              });
              const nextBatch = filterRelatedProducts(nextResponse.data, currentProductId);
              if (nextBatch.length === 0) {
                break;
              }
              setProducts((prev) =>
                mergeUniqueRelatedProducts([...prev, ...nextBatch]).slice(0, RELATED_PRODUCTS_MAX)
              );
              loaded += nextResponse.data.length;
              const total = Math.min(nextResponse.meta?.total ?? loaded, RELATED_PRODUCTS_MAX);
              if (loaded >= total) {
                break;
              }
            }
            return;
          }

          const firstResponse = await apiClient.get<{
            data: RelatedCardPayload[];
            meta: { total: number };
          }>(`/api/v1/products/${encoded}/related`, {
            params: { lang: language, offset: '0', limit: String(RELATED_PRODUCTS_LIMIT) },
          });
          const firstBatch = filterRelatedProducts(firstResponse.data, currentProductId);
          const total = Math.min(
            firstResponse.meta?.total ?? firstBatch.length,
            RELATED_PRODUCTS_MAX
          );
          setProducts(firstBatch);

          let loaded = firstResponse.data.length;
          while (loaded < total) {
            const nextResponse = await apiClient.get<{
              data: RelatedCardPayload[];
              meta: { total: number };
            }>(`/api/v1/products/${encoded}/related`, {
              params: {
                lang: language,
                offset: String(loaded),
                limit: String(RELATED_PRODUCTS_LIMIT),
              },
            });
            const nextBatch = filterRelatedProducts(nextResponse.data, currentProductId);
            if (nextBatch.length === 0) {
              break;
            }
            setProducts((prev) =>
              mergeUniqueRelatedProducts([...prev, ...nextBatch]).slice(0, RELATED_PRODUCTS_MAX)
            );
            loaded += nextResponse.data.length;
          }
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

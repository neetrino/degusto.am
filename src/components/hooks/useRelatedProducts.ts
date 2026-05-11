'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api-client';
import { getStoredLanguage, type LanguageCode } from '../../lib/language';
import { logger } from "@/lib/utils/logger";

interface RelatedProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  brand?: {
    id: string;
    name: string;
  } | null;
  categories?: Array<{
    id: string;
    slug: string;
    title: string;
  }>;
  variants?: Array<{
    options?: Array<{
      key: string;
      value: string;
    }>;
  }>;
}

interface UseRelatedProductsProps {
  categorySlug?: string;
  currentProductId: string;
  language: LanguageCode;
  /** When set (PDP), uses cached `/api/v1/products/[slug]/related` instead of list API. */
  productSlug?: string;
}

/**
 * Hook for fetching related products
 */
export function useRelatedProducts({
  categorySlug,
  currentProductId,
  language,
  productSlug,
}: UseRelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true);

        if (productSlug) {
          const encoded = encodeURIComponent(productSlug.trim());
          const response = await apiClient.get<{
            data: RelatedProduct[];
            meta: { total: number };
          }>(`/api/v1/products/${encoded}/related`, {
            params: { lang: language },
          });
          const filtered = response.data.filter((p) => p.id !== currentProductId);
          setProducts(filtered.slice(0, 10));
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
          data: RelatedProduct[];
          meta: {
            total: number;
          };
        }>('/api/v1/products', {
          params,
        });

        logger.debug('[RelatedProducts] Received products:', response.data.length);
        const filtered = response.data.filter((p) => p.id !== currentProductId);
        logger.debug('[RelatedProducts] After filtering current product:', filtered.length);
        const finalProducts = filtered.slice(0, 10);
        logger.debug('[RelatedProducts] Final products to display:', finalProducts.length);
        setProducts(finalProducts);
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
  }, [categorySlug, currentProductId, language, productSlug]);

  return { products, loading };
}





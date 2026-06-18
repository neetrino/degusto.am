'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@shop/ui';
import { apiClient } from '../../lib/api-client';
import { getStoredCurrency, HYDRATION_SAFE_CURRENCY } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useTranslation } from '../../lib/i18n-client';
import { emitCompareUpdated } from '../../lib/compare-api';
import { useAuth } from '../../lib/auth/AuthContext';
import { logger } from '../../lib/utils/logger';
import { CompareProductsTable, type CompareProduct } from './CompareProductsTable';
import { STOREFRONT_PAGE_CONTAINER_CLASS } from '@/constants/storefront-desktop-layout';
import { useCompareIdsContext } from '@/lib/compare/CompareIdsProvider';
import { normalizeCartApiResponse } from '@/lib/cart/cart-client-normalization';
import { publishCartUpdated } from '@/lib/cart/cart-events';

interface CompareSection {
  sectionKey: string;
  sectionTitle: string;
  products: CompareProduct[];
}

function buildCompareSections(
  compareIds: string[],
  productList: CompareProduct[],
  uncategorizedLabel: string
): CompareSection[] {
  const byId = new Map(productList.map((p) => [p.id, p]));
  const ordered = compareIds
    .map((id) => byId.get(id))
    .filter((p): p is CompareProduct => p !== undefined);

  const sections: CompareSection[] = [];
  const keyToIndex = new Map<string, number>();

  for (const product of ordered) {
    const first = product.categories?.[0];
    const sectionKey = first?.id ?? '__uncategorized__';
    const sectionTitle = first?.title || uncategorizedLabel;

    let idx = keyToIndex.get(sectionKey);
    if (idx === undefined) {
      idx = sections.length;
      keyToIndex.set(sectionKey, idx);
      sections.push({ sectionKey, sectionTitle, products: [] });
    }
    sections[idx].products.push(product);
  }

  return sections;
}

/**
 * Compare page renders up to four products side-by-side with quick actions.
 */
export default function ComparePage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { compareIds: sharedCompareIds, refreshCompareIds } = useCompareIdsContext();
  const { t } = useTranslation();
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [currency, setCurrency] = useState(HYDRATION_SAFE_CURRENCY);
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  /**
   * Fetch compare products for provided ids and update UI state.
   */
  const fetchCompareProducts = useCallback(async (idsToLoad: string[]) => {
    if (idsToLoad.length === 0) {
      logger.debug('[Compare] Skip fetch because ids array is empty');
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug(`[Compare] Fetching ${idsToLoad.length} products for render`);
      const languagePreference = getStoredLanguage();
      const response = await apiClient.get<{
        data: CompareProduct[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>('/api/v1/products', {
        params: {
          ids: idsToLoad.join(','),
          limit: String(idsToLoad.length),
          lang: languagePreference,
        },
      });

      const productById = new Map(response.data.map((product) => [product.id, product]));
      const compareProducts = idsToLoad
        .map((id) => productById.get(id))
        .filter((product): product is CompareProduct => product !== undefined);
      setProducts(compareProducts);

      const normalizedIds = compareProducts.map((product) => product.id);
      if (normalizedIds.length !== idsToLoad.length) {
        setCompareIds(normalizedIds);
        emitCompareUpdated();
      }
    } catch (error) {
      logger.error('[Compare] Error fetching compare products', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ids = sharedCompareIds;
    setCompareIds(ids);
    void fetchCompareProducts(ids);
  }, [fetchCompareProducts, sharedCompareIds]);

  // Listen for currency and language updates
  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    const handleLanguageUpdate = () => {
      const currentIds = sharedCompareIds;
      void fetchCompareProducts(currentIds);
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('language-updated', handleLanguageUpdate);
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
    };
  }, [fetchCompareProducts, sharedCompareIds]);

  const handleRemove = (e: MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    logger.debug(`[Compare] Removing product ${productId} from compare UI`);

    const updatedIds = compareIds.filter((id) => id !== productId);
    const updatedProducts = products.filter((p) => p.id !== productId);

    setCompareIds(updatedIds);
    setProducts(updatedProducts);

    emitCompareUpdated();

    void apiClient.delete(`/api/v1/compare/${productId}`).catch((error) => {
      logger.error('[Compare] Failed to remove item from server compare', { error });
      setCompareIds(compareIds);
      setProducts(products);
      emitCompareUpdated();
      void refreshCompareIds();
    });
  };

  const handleAddToCart = async (e: MouseEvent, product: CompareProduct) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.inStock) {
      return;
    }

    if (!isLoggedIn) {
      router.push(`/login?redirect=/compare`);
      return;
    }

    setAddingToCart(prev => new Set(prev).add(product.id));

    try {
      // Get product details to get variant ID
      interface ProductDetails {
        id: string;
        variants?: Array<{
          id: string;
          sku: string;
          price: number;
          stock: number;
          available: boolean;
        }>;
      }

      const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${product.slug}`);

      if (!productDetails.variants || productDetails.variants.length === 0) {
        alert(t('common.alerts.noVariantsAvailable'));
        return;
      }

      const variantId = productDetails.variants[0].id;
      
      const response = await apiClient.post<unknown>(
        '/api/v1/cart/items',
        {
          productId: product.id,
          variantId: variantId,
          quantity: 1,
        }
      );
      const cart = normalizeCartApiResponse(response);
      publishCartUpdated(cart.itemsCount, cart.totals.total);
    } catch (error: unknown) {
      logger.error('Error adding to cart from compare', { error });
      const message = error instanceof Error ? error.message : '';
      if (message.includes('401') || message.includes('Unauthorized')) {
        router.push(`/login?redirect=/compare`);
      }
    } finally {
      setAddingToCart(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  const compareSections = useMemo(
    () => buildCompareSections(compareIds, products, t('common.compare.uncategorized')),
    [compareIds, products, t]
  );

  if (loading) {
    return (
      <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} py-6`}>
        <div className="text-center py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4 mx-auto"></div>
            <div className="mt-4 bg-gray-200 rounded-lg h-48"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} py-6`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('common.compare.title')}</h1>
        {products.length > 0 && (
          <p className="text-sm text-gray-600">
            {products.length} of 4 {products.length === 1 ? t('common.compare.product') : t('common.compare.products')}
          </p>
        )}
      </div>

      {products.length > 0 ? (
        <div className="space-y-8">
          {compareSections.map((section) => (
            <div key={section.sectionKey}>
              {compareSections.length > 1 && (
                <h2 className="text-lg font-semibold text-gray-800 mb-3">{section.sectionTitle}</h2>
              )}
              <CompareProductsTable
                products={section.products}
                currency={currency}
                addingToCart={addingToCart}
                t={t}
                onRemove={handleRemove}
                onAddToCart={handleAddToCart}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t('common.compare.empty')}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('common.compare.emptyDescription')}
            </p>
            <Link href="/shop">
              <Button variant="primary" size="md">
                {t('common.compare.browseProducts')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}  
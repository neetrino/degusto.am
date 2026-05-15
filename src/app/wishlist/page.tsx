'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@shop/ui';
import { apiClient } from '../../lib/api-client';
import { getStoredCurrency } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { logger } from '../../lib/utils/logger';
import { WishlistHeartIcon } from '../../components/icons/WishlistHeartIcon';
import {
  emitWishlistUpdated,
  getLocalWishlistIds,
  setLocalWishlistIds,
} from '../../lib/wishlist';
import { WishlistProductCard, type WishlistProductCardProduct } from './WishlistProductCard';

type Product = WishlistProductCardProduct;

/**
 * Wishlist page that shows saved products and supports lightweight CRUD actions.
 */
export default function WishlistPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  // Track if we updated locally to prevent unnecessary re-fetch
  const isLocalUpdateRef = useRef(false);

  /**
   * Fetches wishlist products for provided ids and updates component state.
   */
  const fetchWishlistProducts = useCallback(async (idsToLoad: string[]) => {
    if (idsToLoad.length === 0) {
      logger.debug('[Wishlist] Skip fetch because ids array is empty');
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      logger.debug(`[Wishlist] Fetching ${idsToLoad.length} products for render`);
      const languagePreference = getStoredLanguage();
      const response = await apiClient.get<{
        data: Product[];
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
      const wishlistProducts = idsToLoad
        .map((id) => productById.get(id))
        .filter((product): product is Product => product !== undefined);
      setProducts(wishlistProducts);

      const normalizedIds = wishlistProducts.map((product) => product.id);
      if (normalizedIds.length !== idsToLoad.length) {
        setLocalWishlistIds(normalizedIds);
        setWishlistIds(normalizedIds);
        window.dispatchEvent(new Event('wishlist-updated'));
      }
    } catch (error) {
      logger.error('[Wishlist] Error fetching wishlist products', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hydrateWishlist = async () => {
      const localIds = getLocalWishlistIds();

      if (!isLoggedIn) {
        setWishlistIds(localIds);
        fetchWishlistProducts(localIds);
        return;
      }

      try {
        const syncResponse = await apiClient.patch<{ ids?: string[] }>('/api/v1/users/wishlist', {
          ids: localIds,
        });
        const syncedIds = Array.isArray(syncResponse.ids) ? syncResponse.ids : [];
        const normalizedIds = setLocalWishlistIds(syncedIds);
        setWishlistIds(normalizedIds);
        fetchWishlistProducts(normalizedIds);
        emitWishlistUpdated();
      } catch (error) {
        logger.error('[Wishlist] Failed to sync server wishlist, fallback to local cache', { error });
        setWishlistIds(localIds);
        fetchWishlistProducts(localIds);
      }
    };

    hydrateWishlist();

    // Listen for wishlist updates from other components (header, etc.)
    // But don't re-fetch if we already updated locally
    const handleWishlistUpdate = () => {
      // If we just updated locally, skip re-fetch to avoid page reload
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }
      
      // Only re-fetch if update came from external source (another component)
      const updatedIds = getLocalWishlistIds();
      setWishlistIds(updatedIds);
      fetchWishlistProducts(updatedIds);
    };

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, [fetchWishlistProducts, isLoggedIn]);

  const handleRemove = async (productId: string) => {
    logger.debug(`[Wishlist] Removing product ${productId} from wishlist UI`);
    
    // Mark as local update to prevent re-fetch in event handler
    isLocalUpdateRef.current = true;
    
    // Optimistic update: remove from UI immediately (no loading state, no page reload)
    const updatedIds = wishlistIds.filter((id) => id !== productId);
    const updatedProducts = products.filter((p) => p.id !== productId);
    
    // Update localStorage first
    setLocalWishlistIds(updatedIds);
    
    // Update state immediately (no page reload, no loading spinner)
    setWishlistIds(updatedIds);
    setProducts(updatedProducts);
    
    // Dispatch event for other components (header, etc.) - but our handler won't re-fetch
    // because isLocalUpdateRef.current is true
    emitWishlistUpdated();

    if (isLoggedIn) {
      try {
        await apiClient.delete(`/api/v1/users/wishlist/${productId}`);
      } catch (error) {
        logger.error('[Wishlist] Failed to remove item from server wishlist', { error });
        const rollbackIds = [...wishlistIds];
        setLocalWishlistIds(rollbackIds);
        setWishlistIds(rollbackIds);
        setProducts(products);
        emitWishlistUpdated();
      }
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!product.inStock) {
      return;
    }

    if (!isLoggedIn) {
      router.push(`/login?redirect=/wishlist`);
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
      
      await apiClient.post(
        '/api/v1/cart/items',
        {
          productId: product.id,
          variantId: variantId,
          quantity: 1,
        }
      );

      // Trigger cart update event
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: unknown) {
      logger.error('Error adding to cart from wishlist', { error });
      const message = error instanceof Error ? error.message : '';
      if (message.includes('401') || message.includes('Unauthorized')) {
        router.push(`/login?redirect=/wishlist`);
      }
    } finally {
      setAddingToCart(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="py-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="mx-auto h-6 w-1/4 max-w-xs rounded bg-gray-200" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-72 rounded-lg bg-gray-200" />
              <div className="hidden h-72 rounded-lg bg-gray-200 sm:block" />
              <div className="hidden h-72 rounded-lg bg-gray-200 lg:block" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('common.wishlist.title')}</h1>
        {products.length > 0 ? (
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-brand" aria-hidden>
              <WishlistHeartIcon filled size={18} />
            </span>
            <span>
              {t('common.wishlist.totalCount')}:{' '}
              <span className="font-semibold text-brand">{products.length}</span>
            </span>
          </p>
        ) : null}
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <WishlistProductCard
              key={product.id}
              product={product}
              currency={currency}
              isAddingToCart={addingToCart.has(product.id)}
              onRemove={handleRemove}
              onAddToCart={handleAddToCart}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center text-brand" aria-hidden>
              <WishlistHeartIcon filled size={40} />
            </div>
            <h2 className="mb-2 text-xl font-bold text-gray-900">{t('common.wishlist.empty')}</h2>
            <p className="mb-4 text-sm text-gray-600">{t('common.wishlist.emptyDescription')}</p>
            <Link href="/shop">
              <Button variant="primary" size="md" className="!bg-brand hover:!bg-brand-hover focus:!ring-brand">
                {t('common.buttons.browseProducts')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

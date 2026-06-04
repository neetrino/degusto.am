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
import { emitWishlistUpdated } from '../../lib/wishlist';
import { fetchWishlistIds } from '../../lib/wishlist-api';
import { MOBILE_SHOP_PRODUCTS_GRID_CLASS } from '../../constants/mobile-figma-storefront';
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
        setWishlistIds(normalizedIds);
        emitWishlistUpdated();
      }
    } catch (error) {
      logger.error('[Wishlist] Error fetching wishlist products', { error });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const hydrateWishlist = async () => {
      if (!isLoggedIn) {
        setWishlistIds([]);
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const ids = await fetchWishlistIds();
        setWishlistIds(ids);
        await fetchWishlistProducts(ids);
      } catch (error) {
        logger.error('[Wishlist] Failed to load server wishlist', { error });
        setWishlistIds([]);
        setProducts([]);
        setLoading(false);
      }
    };

    void hydrateWishlist();

    const handleWishlistUpdate = async () => {
      if (isLocalUpdateRef.current) {
        isLocalUpdateRef.current = false;
        return;
      }

      if (!isLoggedIn) {
        return;
      }

      const updatedIds = await fetchWishlistIds();
      setWishlistIds(updatedIds);
      void fetchWishlistProducts(updatedIds);
    };

    const handleAuthUpdate = () => {
      void hydrateWishlist();
    };

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    window.addEventListener('auth-updated', handleAuthUpdate);
    window.addEventListener('currency-updated', handleCurrencyUpdate);
    return () => {
      window.removeEventListener('wishlist-updated', handleWishlistUpdate);
      window.removeEventListener('auth-updated', handleAuthUpdate);
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

    setWishlistIds(updatedIds);
    setProducts(updatedProducts);

    emitWishlistUpdated();

    try {
      await apiClient.delete(`/api/v1/users/wishlist/${productId}`);
    } catch (error) {
      logger.error('[Wishlist] Failed to remove item from server wishlist', { error });
      const rollbackIds = [...wishlistIds];
      setWishlistIds(rollbackIds);
      setProducts(products);
      emitWishlistUpdated();
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
            <div className={`mt-4 ${MOBILE_SHOP_PRODUCTS_GRID_CLASS} lg:grid-cols-3`}>
              <div className="h-72 rounded-lg bg-gray-200" />
              <div className="h-72 rounded-lg bg-gray-200" />
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
        <div
          className={`${MOBILE_SHOP_PRODUCTS_GRID_CLASS} max-sm:gap-y-[30px] sm:gap-6 lg:grid-cols-3 xl:grid-cols-4`}
        >
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
            {!isLoggedIn ? (
              <Link href="/login?redirect=/wishlist" className="mb-4 inline-block">
                <Button variant="primary" size="md" className="!bg-brand hover:!bg-brand-hover focus:!ring-brand">
                  {t('common.navigation.login')}
                </Button>
              </Link>
            ) : null}
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

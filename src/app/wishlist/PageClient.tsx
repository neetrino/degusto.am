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
import { fetchWishlistIds, invalidateWishlistIdsCache } from '../../lib/wishlist-api';
import { useWishlistIdsContext } from '../../lib/wishlist/WishlistIdsProvider';
import {
  mergeWishlistProductsByIds,
} from '../../lib/wishlist/wishlist-product-snapshot';
import {
  readCachedWishlistProducts,
  removeWishlistProductFromCache,
  writeCachedWishlistProducts,
} from '../../lib/wishlist/wishlist-products-cache';
import { MOBILE_SHOP_PRODUCTS_GRID_CLASS } from '../../constants/mobile-figma-storefront';
import { STOREFRONT_PAGE_CONTAINER_CLASS } from '@/constants/storefront-desktop-layout';
import { WishlistProductCard, type WishlistProductCardProduct } from './WishlistProductCard';
import {
  publishCartForceReload,
  publishCartLineConfirmed,
  publishOptimisticCartAdd,
} from '@/lib/cart/cart-events';
import { readCartSummaryCache } from '@/lib/cartSummaryCache';
import { resolveQuickAddVariantId } from '@/lib/products/fetch-quick-add-product-client';

type Product = WishlistProductCardProduct;
const WISHLIST_CART_COMMIT_DELAY_MS = 1000;
const WISHLIST_ADDED_BADGE_MS = 1400;

function buildInitialWishlistProducts(contextIds: string[]): Product[] {
  const cached = readCachedWishlistProducts();
  if (contextIds.length === 0) {
    return cached;
  }
  return mergeWishlistProductsByIds(contextIds, cached);
}

/**
 * Wishlist page that shows saved products and supports lightweight CRUD actions.
 */
export default function WishlistPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { setProductInWishlist, wishlistProductIds } = useWishlistIdsContext();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>(() =>
    buildInitialWishlistProducts(wishlistProductIds)
  );
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isHydrating, setIsHydrating] = useState(true);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [queueingAddToCart, setQueueingAddToCart] = useState<Set<string>>(new Set());
  const [recentlyAddedToCart, setRecentlyAddedToCart] = useState<Set<string>>(new Set());
  // Track if we updated locally to prevent unnecessary re-fetch
  const isLocalUpdateRef = useRef(false);
  const addBadgeTimersRef = useRef<Map<string, number>>(new Map());
  const productsRef = useRef(products);
  productsRef.current = products;

  /**
   * Fetches wishlist products for provided ids and updates component state.
   */
  const fetchWishlistProducts = useCallback(async (idsToLoad: string[], currentProducts: Product[]) => {
    if (idsToLoad.length === 0) {
      logger.debug('[Wishlist] Skip fetch because ids array is empty');
      setProducts([]);
      writeCachedWishlistProducts([]);
      return;
    }

    const cached = readCachedWishlistProducts();
    const optimisticProducts = mergeWishlistProductsByIds(idsToLoad, cached, currentProducts);
    if (optimisticProducts.length > 0) {
      setProducts(optimisticProducts);
    }

    try {
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
          view: 'card',
        },
      });

      const wishlistProducts = mergeWishlistProductsByIds(
        idsToLoad,
        cached,
        currentProducts,
        response.data
      );
      setProducts(wishlistProducts);
      writeCachedWishlistProducts(wishlistProducts);

      const normalizedIds = wishlistProducts.map((product) => product.id);
      if (normalizedIds.length !== idsToLoad.length) {
        setWishlistIds(normalizedIds);
        emitWishlistUpdated();
      }
    } catch (error) {
      logger.error('[Wishlist] Error fetching wishlist products', { error });
    }
  }, []);

  useEffect(() => {
    const hydrateWishlist = async () => {
      setIsHydrating(true);
      if (!isLoggedIn) {
        setWishlistIds([]);
        setProducts([]);
        writeCachedWishlistProducts([]);
        setIsHydrating(false);
        return;
      }

      try {
        invalidateWishlistIdsCache();
        const ids = await fetchWishlistIds();
        setWishlistIds(ids);
        await fetchWishlistProducts(ids, buildInitialWishlistProducts(ids));
      } catch (error) {
        logger.error('[Wishlist] Failed to load server wishlist', { error });
        setWishlistIds([]);
        setProducts([]);
        writeCachedWishlistProducts([]);
      } finally {
        setIsHydrating(false);
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

      invalidateWishlistIdsCache();
      const updatedIds = await fetchWishlistIds();
      setWishlistIds(updatedIds);

      const cached = readCachedWishlistProducts();
      const merged = mergeWishlistProductsByIds(updatedIds, cached, productsRef.current);
      setProducts(merged);
      void fetchWishlistProducts(updatedIds, merged);
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

  useEffect(() => {
    if (!isLoggedIn || wishlistProductIds.length === 0) {
      return;
    }
    setProducts((current) => {
      const merged = mergeWishlistProductsByIds(
        wishlistProductIds,
        readCachedWishlistProducts(),
        current
      );
      return merged.length === current.length &&
        merged.every((product, index) => product.id === current[index]?.id)
        ? current
        : merged;
    });
  }, [isLoggedIn, wishlistProductIds]);

  useEffect(() => {
    return () => {
      for (const timerId of addBadgeTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }
      addBadgeTimersRef.current.clear();
    };
  }, []);

  const handleRemove = async (productId: string) => {
    logger.debug(`[Wishlist] Removing product ${productId} from wishlist UI`);

    // Mark as local update to prevent re-fetch in event handler
    isLocalUpdateRef.current = true;

    const previousIds = wishlistIds;
    const previousProducts = products;
    const updatedIds = previousIds.filter((id) => id !== productId);
    const updatedProducts = previousProducts.filter((p) => p.id !== productId);

    setWishlistIds(updatedIds);
    setProducts(updatedProducts);
    setProductInWishlist(productId, false);
    removeWishlistProductFromCache(productId);
    writeCachedWishlistProducts(updatedProducts);

    try {
      await apiClient.delete(`/api/v1/users/wishlist/${productId}`);
      emitWishlistUpdated();
    } catch (error) {
      logger.error('[Wishlist] Failed to remove item from server wishlist', { error });
      setWishlistIds(previousIds);
      setProducts(previousProducts);
      setProductInWishlist(productId, true);
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

    setQueueingAddToCart((prev) => {
      const next = new Set(prev);
      next.add(product.id);
      return next;
    });
    setRecentlyAddedToCart((prev) => {
      const next = new Set(prev);
      next.add(product.id);
      return next;
    });
    const existingBadgeTimer = addBadgeTimersRef.current.get(product.id);
    if (existingBadgeTimer) {
      window.clearTimeout(existingBadgeTimer);
    }
    const badgeTimer = window.setTimeout(() => {
      setRecentlyAddedToCart((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
      addBadgeTimersRef.current.delete(product.id);
    }, WISHLIST_ADDED_BADGE_MS);
    addBadgeTimersRef.current.set(product.id, badgeTimer);

    const optimisticVariantId = `pending:${product.id}`;
    publishOptimisticCartAdd({
      productId: product.id,
      productSlug: product.slug,
      variantId: optimisticVariantId,
      title: product.title,
      image: product.image,
      price: product.price,
      quantity: 1,
    });

    await new Promise((resolve) => window.setTimeout(resolve, WISHLIST_CART_COMMIT_DELAY_MS));

    try {
      const variantId = await resolveQuickAddVariantId(product.slug, product.defaultVariantId);

      if (!variantId) {
        alert(t('common.alerts.noVariantsAvailable'));
        return;
      }
      
      const addToCartResponse = await apiClient.post<{
        item: { id: string; quantity: number; price: number };
        cartSummary?: { itemsCount: number; total: number };
      }>(
        '/api/v1/cart/items',
        {
          productId: product.id,
          variantId: variantId,
          quantity: 1,
        }
      );

      const summary = addToCartResponse.cartSummary ?? (() => {
        const cached = readCartSummaryCache();
        return {
          itemsCount: cached?.itemsCount ?? 0,
          total: cached?.total ?? 0,
        };
      })();

      publishCartLineConfirmed(
        {
          productId: product.id,
          previousVariantId: optimisticVariantId,
          variantId,
          serverItemId: addToCartResponse.item.id,
          quantity: addToCartResponse.item.quantity,
          price: addToCartResponse.item.price,
        },
        summary
      );
    } catch (error: unknown) {
      logger.error('Error adding to cart from wishlist', { error });
      const message = error instanceof Error ? error.message : '';
      if (message.includes('401') || message.includes('Unauthorized')) {
        router.push(`/login?redirect=/wishlist`);
      }
      setRecentlyAddedToCart((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
      publishCartForceReload();
    } finally {
      setQueueingAddToCart(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }
  };

  if (isHydrating && products.length === 0) {
    return (
      <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} py-6`} aria-busy="true" aria-label="Loading wishlist">
        <div className="mb-4 h-8 w-56 animate-pulse rounded bg-[#f3f3f3]" />
        <div
          className={`${MOBILE_SHOP_PRODUCTS_GRID_CLASS} max-sm:gap-y-[30px] sm:gap-6 lg:grid-cols-3 xl:grid-cols-4`}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-[280px] animate-pulse rounded-[24px] bg-[#f8f8f8]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${STOREFRONT_PAGE_CONTAINER_CLASS} py-6`}>
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
              isQueueingAddToCart={queueingAddToCart.has(product.id)}
              isRecentlyAddedToCart={recentlyAddedToCart.has(product.id)}
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

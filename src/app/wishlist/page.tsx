'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@shop/ui';
import { apiClient, ApiError } from '../../lib/api-client';
import { getStoredCurrency, HYDRATION_SAFE_CURRENCY } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { logger } from '../../lib/utils/logger';
import { WishlistHeartIcon } from '../../components/icons/WishlistHeartIcon';
import { emitWishlistUpdated } from '../../lib/wishlist';
import { removeWishlistProductSnapshot } from '@/lib/wishlist/wishlist-products-cache';
import { useWishlistIdsContext } from '../../lib/wishlist/WishlistIdsProvider';
import { MOBILE_SHOP_PRODUCTS_GRID_CLASS } from '../../constants/mobile-figma-storefront';
import { STOREFRONT_PAGE_CONTAINER_CLASS } from '@/constants/storefront-desktop-layout';
import { WishlistProductCard, type WishlistProductCardProduct } from './WishlistProductCard';
import {
  clearWishlistProductSnapshots,
  getWishlistProductsForIds,
  mergeWishlistProductSnapshots,
  readCachedWishlistProducts,
  upsertWishlistProductSnapshot,
} from '@/lib/wishlist/wishlist-products-cache';
import {
  buildWishlistProductsForIds,
} from '@/lib/wishlist/sync-wishlist-products';
import {
  publishCartForceReload,
  publishCartLineConfirmed,
  publishOptimisticCartAdd,
} from '@/lib/cart/cart-events';
import {
  findCartLineByContext,
  normalizeCartApiResponse,
} from '@/lib/cart/cart-client-normalization';

type Product = WishlistProductCardProduct;
const WISHLIST_CART_COMMIT_DELAY_MS = 1000;
const WISHLIST_ADDED_BADGE_MS = 1400;

/**
 * Wishlist page that shows saved products and supports lightweight CRUD actions.
 */
export default function WishlistPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { setProductInWishlist, wishlistIds: sharedWishlistIds } = useWishlistIdsContext();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState(HYDRATION_SAFE_CURRENCY);
  const [queueingAddToCart, setQueueingAddToCart] = useState<Set<string>>(new Set());
  const [recentlyAddedToCart, setRecentlyAddedToCart] = useState<Set<string>>(new Set());
  const addBadgeTimersRef = useRef<Map<string, number>>(new Map());
  const productsRef = useRef<Product[]>([]);
  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const applyWishlistIdsLocally = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }

    setProducts((previous) => buildWishlistProductsForIds(ids, previous));
  }, []);

  /**
   * Background refresh for ids missing cached card snapshots (initial load / legacy items).
   */
  const fetchMissingWishlistProducts = useCallback(
    async (missingIds: string[], orderedIds: string[]) => {
      if (missingIds.length === 0) {
        return;
      }

      const generation = ++fetchGenerationRef.current;

      try {
        logger.debug(`[Wishlist] Background fetch for ${missingIds.length} products`);
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
            ids: missingIds.join(','),
            limit: String(missingIds.length),
            lang: languagePreference,
          },
        });

        if (generation !== fetchGenerationRef.current) {
          return;
        }

        mergeWishlistProductSnapshots(response.data);
        setProducts((previous) =>
          buildWishlistProductsForIds(orderedIds, [...previous, ...response.data])
        );

        const fetchedIds = new Set(response.data.map((product) => product.id));
        if (missingIds.some((id) => !fetchedIds.has(id))) {
          emitWishlistUpdated();
        }
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            logger.warn('[Wishlist] Unauthorized while fetching wishlist products', {
              status: error.status,
              message: error.message,
            });
            return;
          }
          logger.error('[Wishlist] Error fetching wishlist products', {
            status: error.status,
            message: error.message,
            data: error.data,
          });
          return;
        }
        if (error instanceof Error) {
          logger.error('[Wishlist] Error fetching wishlist products', {
            message: error.message,
            stack: error.stack,
          });
          return;
        }
        logger.error('[Wishlist] Error fetching wishlist products', { error });
      }
    },
    []
  );

  useEffect(() => {
    const cached = readCachedWishlistProducts();
    if (cached.length > 0) {
      setProducts(cached);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setProducts([]);
      clearWishlistProductSnapshots();
      return;
    }

    applyWishlistIdsLocally(sharedWishlistIds);

    const missingIds = sharedWishlistIds.filter((id) => {
      const hasCachedSnapshot = getWishlistProductsForIds([id]).length > 0;
      const hasRenderedProduct = productsRef.current.some((product) => product.id === id);
      return !hasCachedSnapshot && !hasRenderedProduct;
    });

    if (missingIds.length > 0) {
      void fetchMissingWishlistProducts(missingIds, sharedWishlistIds);
    }

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, [applyWishlistIdsLocally, fetchMissingWishlistProducts, isLoggedIn, sharedWishlistIds]);

  useEffect(() => {
    return () => {
      for (const timerId of addBadgeTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }
      addBadgeTimersRef.current.clear();
    };
  }, []);

  const handleRemove = (productId: string) => {
    logger.debug(`[Wishlist] Removing product ${productId} from wishlist UI`);
    const previousProducts = productsRef.current;
    const removedProduct = previousProducts.find((product) => product.id === productId);
    const updatedProducts = previousProducts.filter((product) => product.id !== productId);

    setProducts(updatedProducts);
    setProductInWishlist(productId, false);
    removeWishlistProductSnapshot(productId);

    void (async () => {
      try {
        await apiClient.delete(`/api/v1/users/wishlist/${encodeURIComponent(productId)}`);
      } catch (error: unknown) {
        if (error instanceof ApiError) {
          if (error.status === 401) {
            logger.warn('[Wishlist] Unauthorized while removing wishlist item', {
              productId,
              status: error.status,
              message: error.message,
            });
            router.push('/login?redirect=/wishlist');
            setProducts(previousProducts);
            setProductInWishlist(productId, true);
            if (removedProduct) {
              upsertWishlistProductSnapshot(removedProduct);
            }
            return;
          }
          logger.error('[Wishlist] Failed to remove item from server wishlist', {
            productId,
            status: error.status,
            message: error.message,
            data: error.data,
          });
          if (error.status === 401) {
            router.push('/login?redirect=/wishlist');
          }
        } else if (error instanceof Error) {
          logger.error('[Wishlist] Failed to remove item from server wishlist', {
            productId,
            message: error.message,
            stack: error.stack,
          });
        } else {
          logger.error('[Wishlist] Failed to remove item from server wishlist', { productId, error });
        }
        setProducts(previousProducts);
        setProductInWishlist(productId, true);
        if (removedProduct) {
          upsertWishlistProductSnapshot(removedProduct);
        }
      }
    })();
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

      const productDetails = await apiClient.get<ProductDetails>(
        `/api/v1/products/${encodeURIComponent(product.slug)}/details`
      );

      if (!productDetails.variants || productDetails.variants.length === 0) {
        alert(t('common.alerts.noVariantsAvailable'));
        return;
      }

      const variantId = productDetails.variants[0].id;
      
      const addToCartResponse = await apiClient.post<unknown>(
        '/api/v1/cart/items',
        {
          productId: product.id,
          variantId: variantId,
          quantity: 1,
        }
      );
      const cart = normalizeCartApiResponse(addToCartResponse);
      const line = findCartLineByContext(cart, {
        productId: product.id,
        variantId,
      });
      if (!line) {
        publishCartForceReload();
        return;
      }

      const summary = {
        itemsCount: cart.itemsCount,
        total: cart.totals.total,
      };

      publishCartLineConfirmed(
        {
          productId: product.id,
          previousVariantId: optimisticVariantId,
          variantId,
          serverItemId: line.id,
          quantity: line.quantity,
          price: line.price,
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

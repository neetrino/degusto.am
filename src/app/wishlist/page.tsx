'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@shop/ui';
import { apiClient } from '../../lib/api-client';
import { formatPrice, getStoredCurrency } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useTranslation } from '../../lib/i18n-client';
import { useAuth } from '../../lib/auth/AuthContext';
import {
  emitWishlistUpdated,
  getLocalWishlistIds,
  setLocalWishlistIds,
} from '../../lib/wishlist';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  image: string | null;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
  } | null;
}

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
      console.info('[Wishlist] Skip fetch because ids array is empty');
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.info(`[Wishlist] Fetching ${idsToLoad.length} products for render`);
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
      console.error('[Wishlist] Error fetching wishlist products:', error);
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
        console.error('[Wishlist] Failed to sync server wishlist, fallback to local cache:', error);
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
    console.info(`[Wishlist] Removing product ${productId} from wishlist UI`);
    
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
        console.error('[Wishlist] Failed to remove item from server wishlist:', error);
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
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('common.wishlist.title')}</h1>

      {products.length > 0 ? (
        <>
          {/* Total Count Section */}
          <div className="px-6 py-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-base font-medium text-gray-700">
                  {t('common.wishlist.totalCount')}: <span className="font-bold text-gray-900">{products.length}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Products grid (cards side by side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <article
                key={product.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-gray-100 shrink-0">
                  <Link
                    href={`/products/${product.slug}`}
                    className="absolute inset-0 block"
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(product.id);
                    }}
                    className="absolute right-2 top-2 z-10 w-9 h-9 rounded-full flex items-center justify-center bg-white/95 shadow-md border border-gray-200/80 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    aria-label={t('common.ariaLabels.removeFromWishlist')}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-1 gap-3 min-w-0">
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-base font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                  >
                    {product.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold text-blue-600">
                      {formatPrice(product.price, currency)}
                    </span>
                    {product.originalPrice != null && product.originalPrice > product.price && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(product.originalPrice, currency)}
                      </span>
                    )}
                    {product.originalPrice == null &&
                      product.compareAtPrice != null &&
                      product.compareAtPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.compareAtPrice, currency)}
                        </span>
                      )}
                  </div>
                  <div>
                    {product.inStock ? (
                      <span className="text-sm font-medium text-green-600 inline-flex items-center gap-1">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t('common.stock.inStock')}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-red-600">{t('common.stock.outOfStock')}</span>
                    )}
                  </div>
                  <div className="mt-auto pt-2">
                    <Button
                      variant="primary"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock || addingToCart.has(product.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 font-semibold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingToCart.has(product.id) ? t('common.messages.adding') : t('common.buttons.addToCart')}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('common.wishlist.empty')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('common.wishlist.emptyDescription')}
            </p>
            <Link href="/shop">
              <Button variant="primary" size="lg">
                {t('common.buttons.browseProducts')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

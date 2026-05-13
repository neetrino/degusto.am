'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import { isQuietCartStockValidationError } from '../../lib/api-client/error-handler';
import { logger } from '../../lib/utils/logger';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { playCartFlyAnimation } from '../../lib/cart-fly-animation';
import { writeCartSummaryCache } from '../../lib/cartSummaryCache';

interface ProductDetails {
  id: string;
  slug: string;
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    stock: number;
    available: boolean;
  }>;
}

interface GuestCartItem {
  productId: string;
  productSlug: string;
  variantId?: string;
  quantity: number;
  price?: number;
}

interface ServerCartResponse {
  cart: {
    items: Array<{
      id: string;
      quantity: number;
      variant: {
        id: string;
        product: { id: string };
      };
    }>;
  };
}

export interface AddToCartFlyContext {
  origin?: HTMLElement | null;
  imageUrl?: string | null;
}

interface UseAddToCartProps {
  productId: string;
  productSlug: string;
  inStock: boolean;
  /** When present, skip GET /api/v1/products/:slug and use this variant for add-to-cart (one request instead of two). */
  defaultVariantId?: string | null;
  /** Unit price (AMD) — stored in guest cart so Header doesn't need extra API calls. */
  price?: number;
}

/**
 * Hook for adding products to cart
 * @param props - Product information
 * @returns Object with loading state and addToCart function
 */
export function useAddToCart({ productId, productSlug, inStock, defaultVariantId, price: propPrice }: UseAddToCartProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [quantity, setQuantity] = useState(0);

  const resolveVariantId = async (): Promise<string | null> => {
    if (defaultVariantId) {
      return defaultVariantId;
    }

    const encodedSlug = encodeURIComponent(productSlug.trim());
    const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);
    if (!productDetails.variants || productDetails.variants.length === 0) {
      alert(t('common.alerts.noVariantsAvailable'));
      return null;
    }
    return productDetails.variants[0].id;
  };

  const publishGuestCartSummary = (cart: GuestCartItem[]) => {
    const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
    writeCartSummaryCache(itemsCount, total);
    window.dispatchEvent(new CustomEvent('cart-updated', {
      detail: { itemsCount, total },
    }));
  };

  const addToCart = async (fly?: AddToCartFlyContext) => {
    if (!inStock) {
      return;
    }

    // Validate product slug before making API call
    if (!productSlug || productSlug.trim() === '' || productSlug.includes(' ')) {
      logger.warn('[PRODUCT CARD] Invalid product slug', { productSlug });
      alert(t('common.alerts.invalidProduct'));
      return;
    }

    playCartFlyAnimation({
      fromElement: fly?.origin ?? null,
      imageUrl: fly?.imageUrl ?? null,
    });

    // If user is not logged in, use localStorage for cart
    if (!isLoggedIn) {
      setIsAddingToCart(true);
      try {
        const CART_KEY = 'shop_cart_guest';
        const stored = localStorage.getItem(CART_KEY);
        const cart: Array<{ productId: string; productSlug: string; variantId?: string; quantity: number; price?: number }> = stored ? JSON.parse(stored) : [];

        let variantId: string;
        let resolvedProductId = productId;
        let variantStock: number | undefined;
        let variantPrice: number | undefined = propPrice || undefined;
        if (defaultVariantId) {
          variantId = defaultVariantId;
        } else {
          const encodedSlug = encodeURIComponent(productSlug.trim());
          const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);
          resolvedProductId = productDetails.id;
          if (!productDetails.variants || productDetails.variants.length === 0) {
            alert(t('common.alerts.noVariantsAvailable'));
            setIsAddingToCart(false);
            return;
          }
          variantId = productDetails.variants[0].id;
          variantStock = productDetails.variants[0].stock;
          if (!variantPrice) variantPrice = productDetails.variants[0].price;
        }

        const existingItem = cart.find(
          item => item.productId === resolvedProductId && item.variantId === variantId
        );
        const currentQuantityInCart = existingItem?.quantity || 0;
        const totalQuantity = currentQuantityInCart + 1;

        if (variantStock !== undefined && totalQuantity > variantStock) {
          alert(t('common.alerts.noMoreStockAvailable'));
          setIsAddingToCart(false);
          return;
        }

        if (existingItem) {
          existingItem.quantity = totalQuantity;
          if (!existingItem.productSlug) existingItem.productSlug = productSlug;
          if (variantPrice) existingItem.price = variantPrice;
        } else {
          cart.push({
            productId: resolvedProductId,
            productSlug,
            variantId,
            quantity: 1,
            price: variantPrice || 0,
          });
        }

        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        publishGuestCartSummary(cart);
        setQuantity(totalQuantity);
      } catch (error: unknown) {
        logger.error('[PRODUCT CARD] Error adding to guest cart', { error });
        const err = error as { message?: string; status?: number };
        if (err?.message?.includes('does not exist') || err?.message?.includes('404') || err?.status === 404) {
          alert(t('common.alerts.productNotFound'));
        } else {
          router.push(`/login?redirect=/products`);
        }
      } finally {
        setIsAddingToCart(false);
      }
      return;
    }

    setIsAddingToCart(true);

    try {
      let variantId: string;
      if (defaultVariantId) {
        variantId = defaultVariantId;
      } else {
        const encodedSlug = encodeURIComponent(productSlug.trim());
        const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);
        if (!productDetails.variants || productDetails.variants.length === 0) {
          alert(t('common.alerts.noVariantsAvailable'));
          return;
        }
        const firstVariant = productDetails.variants[0];
        variantId = firstVariant.id;
      }

      const response = await apiClient.post<{
        item: { id: string; quantity: number; price: number };
        cartSummary?: { itemsCount: number; total: number };
      }>(
        '/api/v1/cart/items',
        {
          productId: productId,
          variantId: variantId,
          quantity: 1,
        }
      );

      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: response.cartSummary || null,
      }));
      setQuantity(prev => prev + 1);
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        status?: number;
        statusCode?: number;
        data?: unknown;
        response?: {
          data?: {
            detail?: string;
            title?: string;
          };
        };
      };

      if (error instanceof ApiError && isQuietCartStockValidationError(error.status, error.data)) {
        alert(t('common.alerts.noMoreStockAvailable'));
        window.dispatchEvent(new Event('cart-updated'));
        setIsAddingToCart(false);
        return;
      }

      if (err?.message?.includes('does not exist') || err?.message?.includes('404') || err?.status === 404 || err?.statusCode === 404) {
        alert(t('common.alerts.productNotFound'));
        setIsAddingToCart(false);
        return;
      }

      if (
        err.response?.data?.detail?.includes('No more stock available') ||
        err.response?.data?.detail?.includes('exceeds available stock') ||
        err.response?.data?.title === 'Insufficient stock'
      ) {
        alert(t('common.alerts.noMoreStockAvailable'));
        setIsAddingToCart(false);
        return;
      }

      logger.error('[PRODUCT CARD] Error adding to cart', { error });

      if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err?.status === 401 || err?.statusCode === 401) {
        router.push(`/login?redirect=/products`);
      } else {
        alert(t('common.alerts.failedToAddToCart'));
      }
      window.dispatchEvent(new Event('cart-updated'));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const removeFromCart = async () => {
    if (quantity <= 0) {
      return;
    }

    setIsUpdatingQuantity(true);
    try {
      if (!isLoggedIn) {
        const CART_KEY = 'shop_cart_guest';
        const stored = localStorage.getItem(CART_KEY);
        const cart: GuestCartItem[] = stored ? JSON.parse(stored) : [];
        const variantId = await resolveVariantId();
        if (!variantId) {
          return;
        }

        const existingItem = cart.find(item => item.productId === productId && item.variantId === variantId);
        if (!existingItem) {
          setQuantity(0);
          return;
        }

        if (existingItem.quantity <= 1) {
          const nextCart = cart.filter(item => !(item.productId === productId && item.variantId === variantId));
          localStorage.setItem(CART_KEY, JSON.stringify(nextCart));
          publishGuestCartSummary(nextCart);
          setQuantity(0);
          return;
        }

        existingItem.quantity -= 1;
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        publishGuestCartSummary(cart);
        setQuantity(existingItem.quantity);
        return;
      }

      const cartResponse = await apiClient.get<ServerCartResponse>('/api/v1/cart');
      const cartItem = cartResponse.cart.items.find(
        item => item.variant.product.id === productId && item.variant.id === (defaultVariantId ?? item.variant.id)
      );

      if (!cartItem) {
        setQuantity(0);
        return;
      }

      if (cartItem.quantity <= 1) {
        await apiClient.delete(`/api/v1/cart/items/${cartItem.id}`);
        setQuantity(0);
      } else {
        const nextQty = cartItem.quantity - 1;
        await apiClient.patch(`/api/v1/cart/items/${cartItem.id}`, { quantity: nextQty });
        setQuantity(nextQty);
      }
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: unknown) {
      logger.error('[PRODUCT CARD] Error removing from cart', { error });
      alert(t('common.messages.failedToUpdateQuantity'));
      window.dispatchEvent(new Event('cart-updated'));
    } finally {
      setIsUpdatingQuantity(false);
    }
  };

  return { isAddingToCart, isUpdatingQuantity, quantity, addToCart, removeFromCart };
}





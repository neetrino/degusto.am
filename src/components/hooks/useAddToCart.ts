'use client';

import { useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import { isQuietCartStockValidationError } from '../../lib/api-client/error-handler';
import { logger } from '../../lib/utils/logger';
import { useTranslation } from '../../lib/i18n-client';
import { playCartFlyAnimation } from '../../lib/cart-fly-animation';
import { publishCartUpdated, publishCartForceReload, publishOptimisticCartAdd } from '../../lib/cart/cart-events';
import {
  getCartLineId,
  rememberCartLineId,
  removeCachedLineId,
  updateCachedLineQuantity,
} from '../../lib/cart/cart-line-id-cache';
import { readCartSummaryCache } from '../../lib/cartSummaryCache';

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
  defaultVariantId?: string | null;
  price?: number;
  title?: string;
  image?: string | null;
}

/**
 * Hook for adding products to cart (persisted in database for all users).
 */
export function useAddToCart({
  productId,
  productSlug,
  inStock,
  defaultVariantId,
  price: propPrice,
  title: propTitle,
  image: propImage,
}: UseAddToCartProps) {
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

  const addToCart = async (fly?: AddToCartFlyContext) => {
    if (!inStock) {
      return;
    }

    if (!productSlug || productSlug.trim() === '' || productSlug.includes(' ')) {
      logger.warn('[PRODUCT CARD] Invalid product slug', { productSlug });
      alert(t('common.alerts.invalidProduct'));
      return;
    }

    playCartFlyAnimation({
      fromElement: fly?.origin ?? null,
      imageUrl: fly?.imageUrl ?? null,
    });

    const optimisticVariantId = defaultVariantId ?? `pending:${productId}`;
    const optimisticPrice = propPrice ?? 0;
    const optimisticTitle = propTitle?.trim() || productSlug;
    const optimisticImage = propImage ?? fly?.imageUrl ?? null;

    publishOptimisticCartAdd({
      productId,
      productSlug,
      variantId: optimisticVariantId,
      title: optimisticTitle,
      image: optimisticImage,
      price: optimisticPrice,
      quantity: 1,
    });

    setIsAddingToCart(true);

    try {
      let variantId = defaultVariantId ?? null;
      let unitPrice = propPrice ?? 0;

      if (!variantId) {
        const encodedSlug = encodeURIComponent(productSlug.trim());
        const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);
        if (!productDetails.variants || productDetails.variants.length === 0) {
          alert(t('common.alerts.noVariantsAvailable'));
          publishCartForceReload();
          return;
        }
        const firstVariant = productDetails.variants[0];
        variantId = firstVariant.id;
        unitPrice = propPrice ?? firstVariant.price;
      }

      const response = await apiClient.post<{
        item: { id: string; quantity: number; price: number };
        cartSummary?: { itemsCount: number; total: number };
      }>('/api/v1/cart/items', {
        productId,
        variantId,
        quantity: 1,
      });

      rememberCartLineId(productId, variantId, response.item.id, response.item.quantity);
      if (response.cartSummary) {
        publishCartUpdated(response.cartSummary.itemsCount, response.cartSummary.total);
      } else {
        const cache = readCartSummaryCache();
        publishCartUpdated(
          (cache?.itemsCount ?? 0) + 1,
          (cache?.total ?? 0) + (unitPrice || response.item.price || 0)
        );
      }
      setQuantity((prev) => prev + 1);
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        status?: number;
        statusCode?: number;
        data?: unknown;
        response?: { data?: { detail?: string; title?: string } };
      };

      if (error instanceof ApiError && isQuietCartStockValidationError(error.status, error.data)) {
        alert(t('common.alerts.noMoreStockAvailable'));
        publishCartForceReload();
        return;
      }

      if (
        err?.message?.includes('does not exist') ||
        err?.message?.includes('404') ||
        err?.status === 404 ||
        err?.statusCode === 404
      ) {
        alert(t('common.alerts.productNotFound'));
        publishCartForceReload();
        return;
      }

      if (
        err.response?.data?.detail?.includes('No more stock available') ||
        err.response?.data?.detail?.includes('exceeds available stock') ||
        err.response?.data?.title === 'Insufficient stock'
      ) {
        alert(t('common.alerts.noMoreStockAvailable'));
        publishCartForceReload();
        return;
      }

      logger.error('[PRODUCT CARD] Error adding to cart', { error });
      alert(t('common.alerts.failedToAddToCart'));
      publishCartForceReload();
    } finally {
      setIsAddingToCart(false);
    }
  };

  const removeFromCart = async () => {
    if (quantity <= 0) {
      return;
    }

    const previousQuantity = quantity;
    const nextQuantity = quantity - 1;
    setQuantity(nextQuantity);

    try {
      const variantId = defaultVariantId ?? (await resolveVariantId());
      if (!variantId) {
        setQuantity(previousQuantity);
        return;
      }

      const summaryCache = readCartSummaryCache();
      const estimatedTotal = summaryCache
        ? Math.max(0, summaryCache.total - (propPrice ?? 0))
        : 0;
      const estimatedCount = summaryCache
        ? Math.max(0, summaryCache.itemsCount - 1)
        : nextQuantity;
      publishCartUpdated(estimatedCount, estimatedTotal);

      const cachedLine = getCartLineId(productId, variantId);
      if (cachedLine) {
        if (cachedLine.quantity <= 1) {
          await apiClient.delete(`/api/v1/cart/items/${cachedLine.cartItemId}`);
          removeCachedLineId(productId, variantId);
        } else {
          const patchedQty = cachedLine.quantity - 1;
          await apiClient.patch(`/api/v1/cart/items/${cachedLine.cartItemId}`, { quantity: patchedQty });
          updateCachedLineQuantity(productId, variantId, patchedQty);
        }
        return;
      }

      const cartResponse = await apiClient.get<ServerCartResponse>('/api/v1/cart');
      const cartItem = cartResponse.cart?.items.find(
        (item) => item.variant.product.id === productId && item.variant.id === variantId
      );

      if (!cartItem) {
        setQuantity(0);
        return;
      }

      if (cartItem.quantity <= 1) {
        await apiClient.delete(`/api/v1/cart/items/${cartItem.id}`);
        removeCachedLineId(productId, variantId);
      } else {
        const patchedQty = cartItem.quantity - 1;
        await apiClient.patch(`/api/v1/cart/items/${cartItem.id}`, { quantity: patchedQty });
        rememberCartLineId(productId, variantId, cartItem.id, patchedQty);
      }
    } catch (error: unknown) {
      logger.error('[PRODUCT CARD] Error removing from cart', { error });
      setQuantity(previousQuantity);
      alert(t('common.messages.failedToUpdateQuantity'));
      publishCartForceReload();
    }
  };

  return { isAddingToCart, isUpdatingQuantity, quantity, addToCart, removeFromCart };
}

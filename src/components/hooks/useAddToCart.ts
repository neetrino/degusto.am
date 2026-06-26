'use client';

import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { ApiError } from '../../lib/api-client/types';
import { isQuietCartStockValidationError } from '../../lib/api-client/error-handler';
import { DATABASE_UNAVAILABLE_PUBLIC_DETAIL } from '@/lib/http/problem-details';
import { logger } from '../../lib/utils/logger';
import { useTranslation } from '../../lib/i18n-client';
import { playCartFlyAnimation } from '../../lib/cart-fly-animation';
import { publishCartUpdated, publishCartForceReload, publishOptimisticCartAdd, publishCartLineConfirmed, invalidateCommerceBootstrapAfterCartMutation } from '../../lib/cart/cart-events';
import {
  getCartLineId,
  rememberCartLineId,
  removeCachedLineId,
  updateCachedLineQuantity,
} from '../../lib/cart/cart-line-id-cache';
import { clearCartLineRemoved } from '@/lib/cart/pending-cart-removals';
import { readCartSummaryCache } from '../../lib/cartSummaryCache';
import {
  fetchQuickAddProductBySlug,
  resolveQuickAddVariantId,
} from '@/lib/products/fetch-quick-add-product-client';

const CART_ACTION_RETRY_AFTER_MS = 3000;
const ADD_TO_CART_BLOCK_WINDOW_MS = 700;

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
  const [isUpdatingQuantity, setIsUpdatingQuantity] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const addBlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const releaseAddToCartBlock = (resetState: boolean) => {
    if (addBlockTimerRef.current) {
      clearTimeout(addBlockTimerRef.current);
      addBlockTimerRef.current = null;
    }
    if (resetState) {
      setIsAddingToCart(false);
    }
  };

  const scheduleAddToCartBlockRelease = () => {
    if (addBlockTimerRef.current) {
      clearTimeout(addBlockTimerRef.current);
    }
    addBlockTimerRef.current = setTimeout(() => {
      setIsAddingToCart(false);
      addBlockTimerRef.current = null;
    }, ADD_TO_CART_BLOCK_WINDOW_MS);
  };

  useEffect(
    () => () => {
      releaseAddToCartBlock(false);
    },
    []
  );

  const resolveVariantId = async (): Promise<string | null> => {
    if (defaultVariantId) {
      return defaultVariantId;
    }

    try {
      return await resolveQuickAddVariantId(productSlug);
    } catch {
      alert(t('common.alerts.productNotFound'));
      return null;
    }
  };

  const persistAddToCart = async (
    optimisticVariantId: string,
    addedQuantity: number
  ): Promise<void> => {
    try {
      let variantId = defaultVariantId ?? null;
      let unitPrice = propPrice ?? 0;

      if (!variantId) {
        const quickAdd = await fetchQuickAddProductBySlug(productSlug);
        if (!quickAdd.variants || quickAdd.variants.length === 0) {
          alert(t('common.alerts.noVariantsAvailable'));
          setQuantity((prev) => Math.max(0, prev - addedQuantity));
          publishCartForceReload();
          return;
        }
        const firstVariant = quickAdd.variants[0];
        variantId = firstVariant.id;
        unitPrice = propPrice ?? firstVariant.price;
      }

      const response = await apiClient.post<{
        item: { id: string; quantity: number; price: number };
        cartSummary?: { itemsCount: number; total: number };
      }>('/api/v1/cart/items', {
        productId,
        variantId,
        quantity: addedQuantity,
      });

      rememberCartLineId(productId, variantId, response.item.id, response.item.quantity);
      clearCartLineRemoved({
        variant: { id: variantId },
        productId,
        customizations: undefined,
      });

      const summary = response.cartSummary ?? (() => {
        const cache = readCartSummaryCache();
        return {
          itemsCount: (cache?.itemsCount ?? 0),
          total: cache?.total ?? 0,
        };
      })();

      publishCartLineConfirmed(
        {
          productId,
          previousVariantId: optimisticVariantId,
          variantId,
          serverItemId: response.item.id,
          quantity: response.item.quantity,
          price: response.item.price,
        },
        summary
      );
    } catch (error: unknown) {
      setQuantity((prev) => Math.max(0, prev - addedQuantity));

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

      if (error instanceof ApiError && error.status === 503) {
        alert(
          `${error.message || DATABASE_UNAVAILABLE_PUBLIC_DETAIL}\n\n` +
            `Please try again in ${CART_ACTION_RETRY_AFTER_MS / 1000} seconds.`
        );
        return;
      }

      logger.error('[PRODUCT CARD] Error adding to cart', { error });
      alert(t('common.alerts.failedToAddToCart'));
      publishCartForceReload();
    }
  };

  const addToCart = (fly?: AddToCartFlyContext) => {
    if (!inStock || isAddingToCart) {
      return;
    }

    if (!productSlug || productSlug.trim() === '' || productSlug.includes(' ')) {
      logger.warn('[PRODUCT CARD] Invalid product slug', { productSlug });
      alert(t('common.alerts.invalidProduct'));
      return;
    }
    setIsAddingToCart(true);
    scheduleAddToCartBlockRelease();

    playCartFlyAnimation({
      fromElement: fly?.origin ?? null,
    });

    const optimisticVariantId = defaultVariantId ?? `pending:${productId}`;
    const optimisticPrice = propPrice ?? 0;
    const optimisticTitle = propTitle?.trim() || productSlug;
    const optimisticImage = propImage ?? fly?.imageUrl ?? null;
    const addedQuantity = 1;

    publishOptimisticCartAdd({
      productId,
      productSlug,
      variantId: optimisticVariantId,
      title: optimisticTitle,
      image: optimisticImage,
      price: optimisticPrice,
      quantity: addedQuantity,
    });

    setQuantity((prev) => prev + addedQuantity);
    void persistAddToCart(optimisticVariantId, addedQuantity);
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
        invalidateCommerceBootstrapAfterCartMutation();
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
      invalidateCommerceBootstrapAfterCartMutation();
    } catch (error: unknown) {
      logger.error('[PRODUCT CARD] Error removing from cart', { error });
      setQuantity(previousQuantity);
      alert(t('common.messages.failedToUpdateQuantity'));
      publishCartForceReload();
    }
  };

  return { isAddingToCart, isUpdatingQuantity, quantity, addToCart, removeFromCart };
}

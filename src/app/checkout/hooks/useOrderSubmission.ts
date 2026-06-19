import type { MutableRefObject } from 'react';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { finalizeCartAfterCheckout } from '../../../lib/cart/cart-events';
import { CHECKOUT_COUPON_CODE_STORAGE_KEY } from '../checkout-coupon-client';
import type { CheckoutFormData, Cart } from '../types';

interface UseOrderSubmissionProps {
  cart: Cart | null;
  isLoggedIn: boolean;
  setError: (error: string | null) => void;
  orderRedirectPendingRef: MutableRefObject<boolean>;
}

function redirectAfterCheckout(
  orderNumber: string,
  paymentUrl: string | null | undefined
): void {
  if (paymentUrl) {
    window.location.href = paymentUrl;
    return;
  }

  const successUrl = `/orders/${encodeURIComponent(orderNumber)}`;
  window.location.replace(successUrl);
}

export function useOrderSubmission({
  cart,
  isLoggedIn,
  setError,
  orderRedirectPendingRef,
}: UseOrderSubmissionProps) {
  const { t } = useTranslation();

  const submitOrder = async (data: CheckoutFormData) => {
    setError(null);
    orderRedirectPendingRef.current = true;

    try {
      if (!isLoggedIn) {
        throw new Error(t('checkout.loginRequired.description'));
      }

      if (!cart) {
        throw new Error(t('checkout.errors.cartEmpty'));
      }

      const cartId = cart.id;

      const shippingAddress = data.shippingMethod === 'delivery' && 
        data.shippingAddress && 
        data.shippingCity
        ? {
            address: data.shippingAddress,
            city: data.shippingCity,
          }
        : undefined;

      const cashChangeFromValue = data.cashChangeFrom?.trim()
        ? Number(data.cashChangeFrom.replace(',', '.'))
        : undefined;
      const couponCode =
        typeof window !== 'undefined'
          ? (() => {
              const raw = localStorage.getItem(CHECKOUT_COUPON_CODE_STORAGE_KEY)?.trim();
              return raw || undefined;
            })()
          : undefined;

      const response = await apiClient.post<{
        order: {
          id: string;
          number: string;
          status: string;
          paymentStatus: string;
          total: number;
          currency: string;
        };
        payment: {
          provider: string;
          paymentUrl: string | null;
          expiresAt: string | null;
        };
        nextAction: string;
      }>('/api/v1/orders/checkout', {
        cartId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        shippingMethod: data.shippingMethod,
        ...(shippingAddress ? { shippingAddress } : {}),
        paymentMethod: data.paymentMethod,
        ...(typeof cashChangeFromValue === 'number' && Number.isFinite(cashChangeFromValue)
          ? { cashChangeFrom: cashChangeFromValue }
          : {}),
        ...(couponCode ? { couponCode } : {}),
        ...(data.orderNotes?.trim() ? { notes: data.orderNotes.trim() } : {}),
      });

      finalizeCartAfterCheckout();
      redirectAfterCheckout(response.order.number, response.payment?.paymentUrl);
    } catch (err: unknown) {
      orderRedirectPendingRef.current = false;
      const error = err as { message?: string };
      setError(error.message || t('checkout.errors.failedToCreateOrder'));
    }
  };

  return { submitOrder };
}





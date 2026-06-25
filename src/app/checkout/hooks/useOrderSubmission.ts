import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { getStoredLanguage } from '../../../lib/language';
import { clearGuestCart } from '../checkoutUtils';
import { resetCartBadgeState } from '../../../lib/cart/cart-events';
import { CHECKOUT_COUPON_CODE_STORAGE_KEY } from '../checkout-coupon-client';
import { submitIdramPaymentForm } from '../utils/submit-idram-form';
import type { IdramFormData } from '@/lib/payments/idram/types';
import type { CheckoutFormData, Cart } from '../types';

interface UseOrderSubmissionProps {
  cart: Cart | null;
  isLoggedIn: boolean;
  deliveryPrice: number | null;
  bagFee: number;
  setError: (error: string | null) => void;
}

export function useOrderSubmission({
  cart,
  isLoggedIn,
  deliveryPrice,
  bagFee,
  setError,
}: UseOrderSubmissionProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const submitOrder = async (data: CheckoutFormData) => {
    setError(null);

    try {
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

      const shippingAmount =
        data.shippingMethod === 'delivery' && deliveryPrice !== null
          ? deliveryPrice + bagFee
          : 0;
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
        shippingAmount: shippingAmount,
        paymentMethod: data.paymentMethod,
        ...(typeof cashChangeFromValue === 'number' && Number.isFinite(cashChangeFromValue)
          ? { cashChangeFrom: cashChangeFromValue }
          : {}),
        ...(couponCode ? { couponCode } : {}),
        ...(data.orderNotes?.trim() ? { notes: data.orderNotes.trim() } : {}),
      });

      if (response.nextAction === 'redirect_to_payment') {
        const provider = response.payment.provider;
        const lang = getStoredLanguage();

        if (provider === 'arca') {
          const init = await apiClient.post<{ redirectUrl: string }>(
            '/api/v1/payments/arca/init',
            { orderNumber: response.order.number, lang }
          );
          window.location.href = init.redirectUrl;
          return;
        }

        if (provider === 'idram') {
          const init = await apiClient.post<{
            formAction: string;
            formData: IdramFormData;
          }>('/api/v1/payments/idram/init', {
            orderNumber: response.order.number,
            lang,
          });
          submitIdramPaymentForm(init.formAction, init.formData);
          return;
        }
      }

      resetCartBadgeState();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CHECKOUT_COUPON_CODE_STORAGE_KEY);
      }

      if (!isLoggedIn) {
        clearGuestCart();
      }

      if (!isLoggedIn) {
        router.push(`/checkout/success?order=${encodeURIComponent(response.order.number)}`);
        return;
      }

      router.push(`/orders/${response.order.number}`);
    } catch (err: unknown) {
      const error = err as { message?: string; data?: { type?: string; detail?: string } };
      const detail = error.data?.detail?.trim() || error.message?.trim();
      const isArcaConfigError =
        error.data?.type === '/problems/config-error' ||
        detail?.includes('Arca rejected register.do');
      setError(
        isArcaConfigError
          ? t('checkout.errors.arcaPaymentUnavailable')
          : detail || t('checkout.errors.failedToCreateOrder')
      );
    }
  };

  return { submitOrder };
}





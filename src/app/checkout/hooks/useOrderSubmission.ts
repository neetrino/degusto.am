import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { clearGuestCart } from '../checkoutUtils';
import type { CheckoutFormData, Cart, CartItem } from '../types';

interface UseOrderSubmissionProps {
  cart: Cart | null;
  isLoggedIn: boolean;
  deliveryPrice: number | null;
  bagFee: number;
  setError: (error: string | null) => void;
}

const COUPON_CODE_STORAGE_KEY = 'checkout_coupon_code';

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

      let cartId = cart.id;
      let items = undefined;

      if (!isLoggedIn && cart.id === 'guest-cart') {
        items = cart.items.map((item: CartItem) => ({
          productId: item.variant.product.id,
          variantId: item.variant.id,
          quantity: item.quantity,
          customizations: item.customizations,
        }));
        cartId = 'guest-cart';
      }

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
          ? localStorage.getItem(COUPON_CODE_STORAGE_KEY)?.trim().toUpperCase() || undefined
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
        cartId: cartId,
        ...(items ? { items } : {}),
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

      if (!isLoggedIn) {
        clearGuestCart();
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem(COUPON_CODE_STORAGE_KEY);
      }

      if (response.payment?.paymentUrl) {
        window.location.href = response.payment.paymentUrl;
        return;
      }

      if (!isLoggedIn) {
        router.push(`/checkout/success?order=${encodeURIComponent(response.order.number)}`);
        return;
      }

      router.push(`/orders/${response.order.number}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || t('checkout.errors.failedToCreateOrder'));
    }
  };

  return { submitOrder };
}





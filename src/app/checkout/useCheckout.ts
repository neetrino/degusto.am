import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStoredCurrency } from '../../lib/currency';
import { getStoredLanguage } from '../../lib/language';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { usePaymentMethods } from './utils/payment-methods';
import { useCheckoutSchema } from './utils/validation-schema';
import { useDeliveryPrice } from './hooks/useDeliveryPrice';
import { useCart } from './hooks/useCart';
import { useUserProfile } from './hooks/useUserProfile';
import { useOrderSubmission } from './hooks/useOrderSubmission';
import { useOrderSummary } from './hooks/useOrderSummary';
import type { CheckoutFormData } from './types';
import { calculateBagAmountByUniqueCategories } from '@/lib/cart/bag-fee';
import { apiClient } from '../../lib/api-client';
import { publishCartForceReload } from '@/lib/cart/cart-events';

export function useCheckout() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [language, setLanguage] = useState(getStoredLanguage());
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [checkoutCouponDiscountUsd, setCheckoutCouponDiscountUsd] = useState(0);
  const [deliveryCities, setDeliveryCities] = useState<string[]>([]);

  const paymentMethods = usePaymentMethods();
  const checkoutSchema = useCheckoutSchema();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      shippingMethod: 'delivery',
      paymentMethod: 'cash_on_delivery',
      shippingAddress: '',
      shippingCity: '',
      cashChangeFrom: '',
      orderNotes: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      cardHolderName: '',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const shippingMethod = watch('shippingMethod');
  const shippingCity = watch('shippingCity');

  const {
    deliveryPrice,
    deliveryUnavailable,
    loadingDeliveryPrice,
  } = useDeliveryPrice(shippingMethod, shippingCity);
  const { cart, loading, fetchCart } = useCart(isLoggedIn);
  useUserProfile(isLoggedIn, isLoading, setValue);
  const bagFee = useMemo(() => {
    if (!cart) {
      return 0;
    }
    return calculateBagAmountByUniqueCategories(cart.items, (item) => ({
      categoryId: item.variant.product.categoryId,
      category: item.variant.product.category,
    }));
  }, [cart]);

  const { submitOrder } = useOrderSubmission({
    cart,
    isLoggedIn,
    deliveryPrice,
    bagFee,
    setError,
  });

  const { orderSummary } = useOrderSummary({
    cart,
    shippingMethod,
    deliveryPrice,
    bagFee,
    currency,
    couponDiscountUsd: checkoutCouponDiscountUsd,
  });

  useEffect(() => {
    if (loading || isLoading) {
      return;
    }
    if (!cart || cart.items.length === 0) {
      router.replace('/shop');
    }
  }, [loading, isLoading, cart, router]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    const handleLanguageUpdate = () => {
      setLanguage(getStoredLanguage());
    };

    const handleCurrencyRatesUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('language-updated', handleLanguageUpdate);
    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('language-updated', handleLanguageUpdate);
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, [isLoggedIn, isLoading]);

  useEffect(() => {
    async function fetchDeliveryCities() {
      try {
        const response = await apiClient.get<{ cities: string[] }>('/api/v1/delivery/locations');
        setDeliveryCities(response.cities ?? []);
      } catch {
        setDeliveryCities([]);
      }
    }

    fetchDeliveryCities();
  }, []);

  useEffect(() => {
    if (shippingMethod !== 'delivery') {
      return;
    }

    if (deliveryCities.length === 0) {
      return;
    }

    const normalizedCurrentCity = shippingCity?.trim().toLowerCase();
    const cityExists = normalizedCurrentCity
      ? deliveryCities.some((city) => city.toLowerCase() === normalizedCurrentCity)
      : false;

    if (!cityExists) {
      setValue('shippingCity', deliveryCities[0]);
    }
  }, [deliveryCities, setValue, shippingCity, shippingMethod]);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (shippingMethod === 'delivery' && deliveryUnavailable) {
      setError(t('checkout.errors.deliveryOnlyYerevan'));
      return;
    }

    if (paymentMethod === 'arca' || paymentMethod === 'idram') {
      setShowCardModal(true);
      return;
    }

    handleSubmit(submitOrder)(e);
  };

  const onSubmit = (data: CheckoutFormData) => {
    submitOrder(data);
  };

  const removeCartItem = async (itemId: string) => {
    try {
      await apiClient.delete(`/api/v1/cart/items/${itemId}`);
      await fetchCart();
      publishCartForceReload();
    } catch {
      setError(t('common.messages.failedToRemoveFromCart'));
    }
  };

  return {
    // State
    cart,
    loading,
    error,
    setError,
    currency,
    showShippingModal,
    setShowShippingModal,
    showCardModal,
    setShowCardModal,
    deliveryPrice,
    bagFee,
    deliveryUnavailable,
    loadingDeliveryPrice,
    // Form
    register,
    handleSubmit,
    errors,
    isSubmitting,
    setValue,
    watch,
    // Computed
    paymentMethod,
    shippingMethod,
    shippingCity,
    paymentMethods,
    deliveryCities,
    orderSummary,
    setCheckoutCouponDiscountUsd,
    // Actions
    handlePlaceOrder,
    onSubmit,
    removeCartItem,
    // Auth
    isLoggedIn,
  };
}

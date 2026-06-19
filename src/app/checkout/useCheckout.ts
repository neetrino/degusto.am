import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getStoredCurrency, HYDRATION_SAFE_CURRENCY } from '../../lib/currency';
import { getStoredLanguage, HYDRATION_SAFE_LANGUAGE } from '../../lib/language';
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
import { useCartDrawer } from '@/components/cart-drawer/cart-drawer-context';
import { handleRemoveItem } from '@/app/cart/cart-handlers';

export function useCheckout() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(HYDRATION_SAFE_CURRENCY);
  const [language, setLanguage] = useState(HYDRATION_SAFE_LANGUAGE);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
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
  const { cart, loading } = useCart(isLoggedIn);
  const { setCart: setDrawerCart, reloadCart: reloadDrawerCart } = useCartDrawer();
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

  const orderRedirectPendingRef = useRef(false);

  const { submitOrder } = useOrderSubmission({
    cart,
    isLoggedIn,
    setError,
    orderRedirectPendingRef,
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
    if (isLoading || isLoggedIn) {
      return;
    }
    setShowLoginRequiredModal(true);
  }, [isLoading, isLoggedIn]);

  useEffect(() => {
    if (loading || isLoading || orderRedirectPendingRef.current) {
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

    if (!isLoggedIn) {
      setShowLoginRequiredModal(true);
      return;
    }

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
    if (!isLoggedIn) {
      setShowLoginRequiredModal(true);
      return;
    }
    submitOrder(data);
  };

  const removeCartItem = async (itemId: string) => {
    if (!cart) {
      return;
    }

    try {
      await handleRemoveItem(
        itemId,
        cart,
        isLoggedIn,
        setDrawerCart,
        async () => {
          await reloadDrawerCart({ silent: true });
        }
      );
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
    showLoginRequiredModal,
    setShowLoginRequiredModal,
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

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { getStoredCurrency, HYDRATION_SAFE_CURRENCY } from '../../../lib/currency';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useTranslation } from '../../../lib/i18n-client';
import { BodyBackground } from '../../../components/BodyBackground';
import { finalizeCartAfterCheckout } from '@/lib/cart/cart-events';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { OrderSuccessView } from './components/OrderSuccessView';
import { ORDER_SUCCESS_PAGE_BG } from './order-success-ui';
import type { Order } from './types';

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(HYDRATION_SAFE_CURRENCY);
  const orderNumber = typeof params.number === 'string' ? params.number : '';

  useEffect(() => {
    finalizeCartAfterCheckout();
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!isLoggedIn) {
      const loginPath = orderNumber
        ? `/login?redirect=${encodeURIComponent(`/orders/${orderNumber}`)}`
        : '/login';
      router.replace(loginPath);
      return;
    }

    void fetchOrder();

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, [isAuthLoading, isLoggedIn, orderNumber, router]);

  async function fetchOrder() {
    if (!orderNumber) {
      setError(t('orders.notFound.description'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get<Order>(`/api/v1/orders/${orderNumber}`);
      setOrder(response);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('orders.notFound.description');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (isAuthLoading || (!isLoggedIn && !error)) {
    return <LoadingState />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !order) {
    return <ErrorState error={error} />;
  }

  return (
    <>
      <BodyBackground color={ORDER_SUCCESS_PAGE_BG} />
      <OrderSuccessView order={order} currency={currency} />
    </>
  );
}

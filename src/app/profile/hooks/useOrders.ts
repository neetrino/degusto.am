import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import type { OrderDetails, OrderListItem, ProfileTab } from '../types';
import {
  fetchOrderDetailsCached,
  fetchOrdersCached,
  getCachedOrderDetailsSync,
  getCachedOrdersSync,
  type OrdersListMeta,
} from '@/lib/users/profile-data-cache';
import { logger } from '@/lib/utils/logger';

interface UseOrdersProps {
  isLoggedIn: boolean;
  authLoading: boolean;
  activeTab: ProfileTab;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

const ORDERS_PAGE_LIMIT = 20;

export function useOrders({
  isLoggedIn,
  authLoading,
  activeTab,
  onError,
  onSuccess,
}: UseOrdersProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const initialOrdersCache = getCachedOrdersSync(1);
  const [orders, setOrders] = useState<OrderListItem[]>(initialOrdersCache?.data ?? []);
  const [ordersLoading, setOrdersLoading] = useState(
    activeTab === 'orders' && initialOrdersCache === null,
  );
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersMeta, setOrdersMeta] = useState<OrdersListMeta | null>(initialOrdersCache?.meta ?? null);

  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedOrder]);

  const loadOrders = useCallback(async () => {
    const cached = getCachedOrdersSync(ordersPage);
    if (cached) {
      setOrders(cached.data);
      setOrdersMeta(cached.meta);
      setOrdersLoading(false);
      return;
    }

    try {
      setOrdersLoading(true);
      onError('');
      const response = await fetchOrdersCached(ordersPage, ORDERS_PAGE_LIMIT);
      setOrders(response.data);
      setOrdersMeta(response.meta);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error loading orders', { error: err });
      onError(errorMessage || t('profile.orders.failedToLoad'));
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage, t, onError]);

  useEffect(() => {
    if (isLoggedIn && !authLoading && activeTab === 'orders') {
      void loadOrders();
    }
  }, [isLoggedIn, authLoading, activeTab, loadOrders]);

  const loadOrderDetails = async (orderNumber: string) => {
    const cached = getCachedOrderDetailsSync(orderNumber);
    if (cached) {
      setSelectedOrder(cached);
      setOrderDetailsError(null);
      setOrderDetailsLoading(false);
      return;
    }

    try {
      setOrderDetailsLoading(true);
      setOrderDetailsError(null);
      const data = await fetchOrderDetailsCached(orderNumber);
      setSelectedOrder(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error loading order details', { error: err });
      setOrderDetailsError(errorMessage || t('profile.orderDetails.failedToLoad'));
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleOrderClick = (orderNumber: string, e: MouseEvent<HTMLAnchorElement>) => {
    if (window.innerWidth >= 1024) {
      e.preventDefault();
      void loadOrderDetails(orderNumber);
    }
  };

  const handleReOrder = async () => {
    if (!selectedOrder || !isLoggedIn) {
      router.push('/login?redirect=/profile?tab=orders');
      return;
    }

    setIsReordering(true);
    try {
      const result = await apiClient.post<{
        orderNumber: string;
        addedCount: number;
        skippedCount: number;
        totalItems: number;
      }>(`/api/v1/orders/${selectedOrder.number}/reorder`, {});

      window.dispatchEvent(new Event('cart-updated'));

      if (result.addedCount > 0) {
        const skippedText =
          result.skippedCount > 0 ? `, ${result.skippedCount} ${t('profile.orderDetails.skipped')}` : '';
        onSuccess(`${result.addedCount} ${t('profile.orderDetails.itemsAdded')}${skippedText}`);
        setTimeout(() => {
          router.push('/shop');
        }, 1500);
      } else {
        onError(t('profile.orderDetails.failedToAdd'));
      }
    } catch (error: unknown) {
      logger.error('Error during re-order', { error });
      onError(t('profile.orderDetails.failedToAdd'));
    } finally {
      setIsReordering(false);
    }
  };

  return {
    orders,
    ordersLoading,
    ordersPage,
    setOrdersPage,
    ordersMeta,
    selectedOrder,
    setSelectedOrder,
    orderDetailsLoading,
    orderDetailsError,
    isReordering,
    handleOrderClick,
    handleReOrder,
  };
}

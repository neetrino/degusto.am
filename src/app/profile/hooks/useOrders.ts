import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import type { OrderDetails, OrderListItem, ProfileTab } from '../types';
import { logger } from "@/lib/utils/logger";

interface OrdersMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseOrdersProps {
  isLoggedIn: boolean;
  authLoading: boolean;
  activeTab: ProfileTab;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export function useOrders({
  isLoggedIn,
  authLoading,
  activeTab,
  onError,
  onSuccess,
}: UseOrdersProps) {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersMeta, setOrdersMeta] = useState<OrdersMeta | null>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Lock body scroll when order modal is open
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
    try {
      setOrdersLoading(true);
      onError('');
      const response = await apiClient.get<{
        data: OrderListItem[];
        meta: OrdersMeta;
      }>('/api/v1/orders', {
        params: {
          page: ordersPage.toString(),
          limit: '20',
        },
      });
      setOrders(response.data || []);
      setOrdersMeta(response.meta || null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error loading orders:', err);
      onError(errorMessage || t('profile.orders.failedToLoad'));
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage, t, onError]);

  // Load orders when orders tab is active
  useEffect(() => {
    if (isLoggedIn && !authLoading && activeTab === 'orders') {
      loadOrders();
    }
  }, [isLoggedIn, authLoading, activeTab, loadOrders]);

  const loadOrderDetails = async (orderNumber: string) => {
    try {
      setOrderDetailsLoading(true);
      setOrderDetailsError(null);
      const data = await apiClient.get<OrderDetails>(`/api/v1/orders/${orderNumber}`);
      setSelectedOrder(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Error loading order details:', err);
      setOrderDetailsError(errorMessage || t('profile.orderDetails.failedToLoad'));
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleOrderClick = (orderNumber: string, e: MouseEvent<HTMLAnchorElement>) => {
    if (window.innerWidth >= 1024) {
      e.preventDefault();
      loadOrderDetails(orderNumber);
    }
  };

  const handleReOrder = async () => {
    if (!selectedOrder || !isLoggedIn) {
      router.push('/login?redirect=/profile?tab=orders');
      return;
    }

    setIsReordering(true);
    try {
      logger.debug('[Profile][ReOrder] Starting re-order for order:', selectedOrder.number);

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
          router.push('/cart');
        }, 1500);
      } else {
        onError(t('profile.orderDetails.failedToAdd'));
      }
    } catch (error: unknown) {
      console.error('[Profile][ReOrder] Error during re-order:', error);
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


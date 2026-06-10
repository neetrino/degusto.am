'use client';

import { useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/utils/logger';
import {
  ADMIN_NEW_ORDER_EVENT,
  ADMIN_NEW_ORDER_POLL_INTERVAL_MS,
  type AdminNewOrderEventDetail,
} from '@/lib/admin/admin-order-alert.constants';
import {
  fetchRecentOrdersShared,
  invalidateRecentOrdersCache,
} from './useAdminDashboard';
import {
  playAdminOrderAlert,
  primeAdminOrderAlertAudio,
} from '@/lib/admin/play-admin-order-alert';
import { showToast } from '@/components/Toast';

type RecentOrderRow = AdminNewOrderEventDetail;

type UseAdminNewOrderAlertsOptions = {
  enabled: boolean;
  alertMessage: (orderNumber: string) => string;
};

function notifyNewOrder(order: RecentOrderRow, alertMessage: (orderNumber: string) => string): void {
  void playAdminOrderAlert();
  showToast(alertMessage(order.number), 'warning', 8000);
  window.dispatchEvent(
    new CustomEvent<AdminNewOrderEventDetail>(ADMIN_NEW_ORDER_EVENT, { detail: order }),
  );
}

export function useAdminNewOrderAlerts({
  enabled,
  alertMessage,
}: UseAdminNewOrderAlertsOptions): void {
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const alertMessageRef = useRef(alertMessage);

  useEffect(() => {
    alertMessageRef.current = alertMessage;
  }, [alertMessage]);

  const pollLatestOrders = useCallback(async () => {
    if (!enabled) {
      return;
    }
    try {
      const orders = (await fetchRecentOrdersShared(8)) as RecentOrderRow[];
      if (orders.length === 0) {
        return;
      }

      if (!initializedRef.current) {
        orders.forEach((order) => seenOrderIdsRef.current.add(order.id));
        initializedRef.current = true;
        return;
      }

      const unseen = orders.filter((order) => !seenOrderIdsRef.current.has(order.id));
      unseen
        .sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
        .forEach((order) => {
          seenOrderIdsRef.current.add(order.id);
          notifyNewOrder(order, alertMessageRef.current);
          invalidateRecentOrdersCache();
        });
    } catch (error: unknown) {
      logger.warn('Admin new-order poll failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const primeOnGesture = () => {
      void primeAdminOrderAlertAudio();
    };
    document.addEventListener('pointerdown', primeOnGesture, { once: true });
    document.addEventListener('keydown', primeOnGesture, { once: true });

    void pollLatestOrders();
    const intervalId = window.setInterval(() => {
      void pollLatestOrders();
    }, ADMIN_NEW_ORDER_POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('pointerdown', primeOnGesture);
      document.removeEventListener('keydown', primeOnGesture);
      window.clearInterval(intervalId);
    };
  }, [enabled, pollLatestOrders]);
}

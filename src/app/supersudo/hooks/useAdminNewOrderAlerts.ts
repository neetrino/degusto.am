'use client';

import { useCallback, useEffect, useRef } from 'react';
import { logger } from '@/lib/utils/logger';
import {
  ADMIN_NEW_ORDER_EVENT,
  ADMIN_NEW_ORDER_POLL_INTERVAL_MS,
  type AdminNewOrderEventDetail,
} from '@/lib/admin/admin-order-alert.constants';
import { ADMIN_RECENT_ORDERS_POLL_LIMIT } from '@/lib/admin/admin-dashboard-cache.constants';
import {
  fetchRecentOrdersForPoll,
  invalidateAdminDashboardCaches,
} from '@/lib/admin/admin-dashboard-client';
import { useVisibilityAwareInterval } from '@/lib/hooks/useVisibilityAwareInterval';
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

  useEffect(() => {
    if (enabled) {
      return;
    }
    seenOrderIdsRef.current.clear();
    initializedRef.current = false;
  }, [enabled]);

  const pollLatestOrders = useCallback(async () => {
    if (!enabled) {
      return;
    }
    try {
      const orders = (await fetchRecentOrdersForPoll(ADMIN_RECENT_ORDERS_POLL_LIMIT, {
        requireFresh: initializedRef.current,
      })) as RecentOrderRow[];
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
          invalidateAdminDashboardCaches();
        });
    } catch (error: unknown) {
      logger.warn('Admin new-order poll failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [enabled]);

  useVisibilityAwareInterval({
    enabled,
    intervalMs: ADMIN_NEW_ORDER_POLL_INTERVAL_MS,
    onTick: () => {
      void pollLatestOrders();
    },
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const primeOnGesture = () => {
      void primeAdminOrderAlertAudio();
    };
    document.addEventListener('pointerdown', primeOnGesture, { once: true });
    document.addEventListener('keydown', primeOnGesture, { once: true });

    return () => {
      document.removeEventListener('pointerdown', primeOnGesture);
      document.removeEventListener('keydown', primeOnGesture);
    };
  }, [enabled]);
}

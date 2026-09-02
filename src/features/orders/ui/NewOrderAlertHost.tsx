"use client";

import { useEffect, useState } from "react";

import { NewOrderAlertPopup } from "@/features/orders/ui/NewOrderAlertPopup";
import {
  ensureOrderAlertBaseline,
  writeOrderAlertAckedAt,
} from "@/features/orders/ui/new-order-alert-storage";
import type {
  NewOrderAlertCopy,
  NewOrderAlertItem,
  NewOrderAlertPollResponse,
} from "@/features/orders/ui/new-order-alert-types";
import { useNewOrderAlertSound } from "@/features/orders/ui/useNewOrderAlertSound";

const POLL_INTERVAL_MS = 5_000;

type NewOrderAlertHostProps = {
  copy: NewOrderAlertCopy;
};

async function fetchOrderAlerts(
  after: string,
): Promise<NewOrderAlertPollResponse | null> {
  const url = `/api/admin/order-alerts?after=${encodeURIComponent(after)}`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as NewOrderAlertPollResponse;
}

/**
 * Polls for new PENDING orders and shows an acknowledge popup with sound.
 * Mount only for ADMIN / DISPATCHER sessions.
 */
export function NewOrderAlertHost({ copy }: NewOrderAlertHostProps) {
  const [ackedAt, setAckedAt] = useState<string | null>(null);
  const [orders, setOrders] = useState<NewOrderAlertItem[]>([]);

  const waitingCount = orders.length;
  const latest = orders[0] ?? null;
  const isOpen = latest !== null;

  useNewOrderAlertSound(isOpen);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setAckedAt(ensureOrderAlertBaseline());
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ackedAt) {
      return;
    }

    let cancelled = false;

    const run = async (): Promise<void> => {
      if (cancelled) return;
      const payload = await fetchOrderAlerts(ackedAt);
      if (cancelled || !payload) return;
      setOrders(payload.orders);
    };

    void run();
    const timer = window.setInterval(() => {
      void run();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [ackedAt]);

  function acknowledgeAll(): void {
    const newest = orders[0];
    const nextAckedAt = newest?.placedAt ?? new Date().toISOString();
    writeOrderAlertAckedAt(nextAckedAt);
    setAckedAt(nextAckedAt);
    setOrders([]);
  }

  if (!latest) {
    return null;
  }

  return (
    <NewOrderAlertPopup
      order={latest}
      waitingCount={waitingCount}
      copy={copy}
      onAcknowledge={acknowledgeAll}
    />
  );
}

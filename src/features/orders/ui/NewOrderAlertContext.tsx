"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

type NewOrderAlertContextValue = {
  /** Unacknowledged PENDING orders waiting for staff attention. */
  waitingCount: number;
};

const NewOrderAlertContext = createContext<NewOrderAlertContextValue | null>(
  null,
);

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

type NewOrderAlertProviderProps = {
  copy: NewOrderAlertCopy;
  children: ReactNode;
};

/**
 * Polls for new PENDING orders, plays alert sound, shows acknowledge popup,
 * and exposes `waitingCount` for nav badges.
 */
export function NewOrderAlertProvider({
  copy,
  children,
}: NewOrderAlertProviderProps) {
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

  const acknowledgeAll = useCallback((): void => {
    const newest = orders[0];
    const nextAckedAt = newest?.placedAt ?? new Date().toISOString();
    writeOrderAlertAckedAt(nextAckedAt);
    setAckedAt(nextAckedAt);
    setOrders([]);
  }, [orders]);

  const value = useMemo(
    () => ({ waitingCount }),
    [waitingCount],
  );

  return (
    <NewOrderAlertContext.Provider value={value}>
      {children}
      {latest ? (
        <NewOrderAlertPopup
          order={latest}
          waitingCount={waitingCount}
          copy={copy}
          onAcknowledge={acknowledgeAll}
        />
      ) : null}
    </NewOrderAlertContext.Provider>
  );
}

/** Unacknowledged new-order count for staff nav badges (0 outside provider). */
export function useNewOrderAlertWaitingCount(): number {
  return useContext(NewOrderAlertContext)?.waitingCount ?? 0;
}

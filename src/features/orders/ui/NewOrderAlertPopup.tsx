"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { displayPaymentMethodLabel } from "@/features/orders/domain/payment-method-display";
import type {
  NewOrderAlertCopy,
  NewOrderAlertItem,
} from "@/features/orders/ui/new-order-alert-types";

type NewOrderAlertPopupProps = {
  order: NewOrderAlertItem;
  waitingCount: number;
  copy: NewOrderAlertCopy;
  onAcknowledge: () => void;
};

function formatAlertMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

/** Formats placedAt as `YYYY-MM-DD HH:mm` in the local timezone. */
function formatAlertDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function applyTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

/**
 * Centered staff popup for a new PENDING order with acknowledge-all action.
 */
export function NewOrderAlertPopup({
  order,
  waitingCount,
  copy,
  onAcknowledge,
}: NewOrderAlertPopupProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setMounted(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const rows: Array<{ label: string; value: string; strong?: boolean }> = [
    { label: copy.customer, value: order.contactName },
    {
      label: copy.total,
      value: formatAlertMoney(order.totalAmount, order.baseCurrency),
      strong: true,
    },
    {
      label: copy.payment,
      value: displayPaymentMethodLabel(order.paymentMethod),
    },
    { label: copy.time, value: formatAlertDateTime(order.placedAt) },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="new-order-alert-title"
    >
      <div className="absolute inset-0 bg-black/35" aria-hidden="true" />

      <div className="relative z-[1] w-full max-w-[26rem] rounded-[1.75rem] bg-white px-6 py-6 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.35)] sm:px-7 sm:py-7">
        <p className="text-[0.7rem] font-bold tracking-[0.08em] text-red-600 uppercase">
          {applyTemplate(copy.badge, { count: waitingCount })}
        </p>

        <h2
          id="new-order-alert-title"
          className="mt-2 text-2xl font-bold tracking-tight text-gray-950"
        >
          {applyTemplate(copy.orderTitle, { orderNumber: order.orderNumber })}
        </h2>

        <dl className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 py-3.5 text-sm"
            >
              <dt className="text-gray-400">{row.label}</dt>
              <dd
                className={
                  row.strong ? "font-semibold text-gray-900" : "text-gray-800"
                }
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={onAcknowledge}
          className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-full bg-red-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm ring-2 ring-inset ring-white/80 transition hover:bg-red-700"
        >
          {applyTemplate(copy.acknowledge, { count: waitingCount })}
        </button>
      </div>
    </div>,
    document.body,
  );
}

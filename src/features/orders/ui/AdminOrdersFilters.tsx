"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Card } from "@/components/ui/Card";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import type { OrderStatus } from "@/features/orders/domain/order-status";
import type { PaymentStatus } from "@/features/orders/domain/payment-status";

const FILTER_SEARCH =
  "h-11 min-w-0 flex-1 rounded-2xl border border-[#ead7bf] bg-white px-4 text-sm text-[#1f1a17] shadow-sm outline-none transition-colors placeholder:text-[#8a837a] hover:border-[#ead7bf] focus:border-[#ead7bf]";

const ORDER_STATUS_FILTERS = [
  { label: "Pending", value: "PENDING" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Completed", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
] as const satisfies ReadonlyArray<{ label: string; value: OrderStatus }>;

const PAYMENT_STATUS_FILTERS = [
  { label: "Paid", value: "CAPTURED" },
  { label: "Pending", value: "PENDING" },
  { label: "Failed", value: "FAILED" },
] as const satisfies ReadonlyArray<{ label: string; value: PaymentStatus }>;

type AdminOrdersFiltersProps = {
  total: number;
  status?: OrderStatus;
  paymentStatus?: string;
  q?: string;
};

export function AdminOrdersFilters({
  total,
  status,
  paymentStatus,
  q,
}: AdminOrdersFiltersProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [statusValue, setStatusValue] = useState(status ?? "");
  const [paymentValue, setPaymentValue] = useState(paymentStatus ?? "");

  function applyStatus(next: string): void {
    flushSync(() => setStatusValue(next));
    formRef.current?.requestSubmit();
  }

  function applyPayment(next: string): void {
    flushSync(() => setPaymentValue(next));
    formRef.current?.requestSubmit();
  }

  return (
    <Card className="mb-6 min-w-0 overflow-visible">
      <form
        ref={formRef}
        method="get"
        className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:flex lg:flex-nowrap lg:items-center lg:gap-3"
      >
        <SelectDropdown
          name="status"
          ariaLabel="Order status"
          value={statusValue}
          allLabel="All statuses"
          options={ORDER_STATUS_FILTERS}
          className="w-full min-w-0 lg:w-[180px] lg:shrink-0"
          onValueChange={applyStatus}
        />
        <SelectDropdown
          name="paymentStatus"
          ariaLabel="Payment status"
          value={paymentValue}
          allLabel="All payment statuses"
          options={PAYMENT_STATUS_FILTERS}
          className="w-full min-w-0 lg:w-[200px] lg:shrink-0"
          onValueChange={applyPayment}
        />
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by order #, customer, email, phone…"
          className={`${FILTER_SEARCH} sm:col-span-2 lg:col-auto`}
          aria-label="Search orders"
        />
      </form>
      <div className="border-t border-[#ead7bf] px-4 py-3">
        <p className="text-sm text-[#5c564e]">Total orders: {total}</p>
      </div>
    </Card>
  );
}

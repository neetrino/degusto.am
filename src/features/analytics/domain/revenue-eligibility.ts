import { ORDER_STATUSES, type OrderStatus } from "@/features/orders/domain/order-status";
import type { PaymentStatus } from "@/features/orders/domain/payment-status";

/** Fulfillment statuses that never count as realized sales. */
export const EXCLUDED_REVENUE_ORDER_STATUSES = [
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly OrderStatus[];

/** Payment statuses that never count as realized sales. */
export const EXCLUDED_REVENUE_PAYMENT_STATUSES = [
  "FAILED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly PaymentStatus[];

export type ExcludedRevenueOrderStatus =
  (typeof EXCLUDED_REVENUE_ORDER_STATUSES)[number];

export type ExcludedRevenuePaymentStatus =
  (typeof EXCLUDED_REVENUE_PAYMENT_STATUSES)[number];

/** Process statuses counted as successful sales when payment is not negative. */
export const DEFAULT_REVENUE_STATUSES: OrderStatus[] = ORDER_STATUSES.filter(
  (status) =>
    !EXCLUDED_REVENUE_ORDER_STATUSES.includes(
      status as ExcludedRevenueOrderStatus,
    ),
);

function isExcludedOrderStatus(
  status: string,
): status is ExcludedRevenueOrderStatus {
  return (EXCLUDED_REVENUE_ORDER_STATUSES as readonly string[]).includes(
    status,
  );
}

function isExcludedPaymentStatus(
  status: string,
): status is ExcludedRevenuePaymentStatus {
  return (EXCLUDED_REVENUE_PAYMENT_STATUSES as readonly string[]).includes(
    status,
  );
}

/** Whether an order counts toward revenue, order count, AOV, and rankings. */
export function isRevenueEligibleOrder(input: {
  isArchived: boolean;
  status: string;
  paymentStatus: string;
}): boolean {
  if (input.isArchived) {
    return false;
  }
  if (isExcludedOrderStatus(input.status)) {
    return false;
  }
  return !isExcludedPaymentStatus(input.paymentStatus);
}

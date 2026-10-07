import {
  ANALYTICS_PAYMENT_METHODS,
  type AnalyticsPaymentMethod,
  type AnalyticsPaymentMethodFilter,
} from "@/features/analytics/domain/payment-method-filter";

export type PaymentBreakdownMetrics = {
  orderCount: number;
  revenueAmount: number;
};

export type PaymentBreakdownRow = PaymentBreakdownMetrics & {
  method: AnalyticsPaymentMethod;
  averageOrderValue: number;
};

function averageOrderValue(revenue: number, orderCount: number): number {
  if (orderCount === 0) {
    return 0;
  }
  return Math.round((revenue / orderCount) * 100) / 100;
}

function toRow(
  method: AnalyticsPaymentMethod,
  metrics: PaymentBreakdownMetrics,
): PaymentBreakdownRow {
  return {
    method,
    orderCount: metrics.orderCount,
    revenueAmount: metrics.revenueAmount,
    averageOrderValue: averageOrderValue(
      metrics.revenueAmount,
      metrics.orderCount,
    ),
  };
}

/**
 * Builds the payment-method breakdown for the selected analytics range.
 * When a method filter is active, the single row mirrors the selected-range totals
 * so UI cards cannot diverge from the main revenue/order metrics.
 */
export function buildPaymentBreakdown(input: {
  paymentMethod: AnalyticsPaymentMethodFilter;
  selectedRange: PaymentBreakdownMetrics;
  byMethod: ReadonlyMap<AnalyticsPaymentMethod, PaymentBreakdownMetrics>;
}): PaymentBreakdownRow[] {
  if (input.paymentMethod !== "all") {
    return [toRow(input.paymentMethod, input.selectedRange)];
  }

  return ANALYTICS_PAYMENT_METHODS.map((method) =>
    toRow(
      method,
      input.byMethod.get(method) ?? { orderCount: 0, revenueAmount: 0 },
    ),
  );
}

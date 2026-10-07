export const ANALYTICS_SHIPPING_METHODS = ["pickup", "delivery"] as const;

export type AnalyticsShippingMethod =
  (typeof ANALYTICS_SHIPPING_METHODS)[number];

export type ShippingBreakdownMetrics = {
  orderCount: number;
  revenueAmount: number;
};

export type ShippingBreakdownRow = ShippingBreakdownMetrics & {
  method: AnalyticsShippingMethod;
  averageOrderValue: number;
};

const SHIPPING_LABELS: Record<AnalyticsShippingMethod, string> = {
  pickup: "Pickup",
  delivery: "Delivery",
};

/** Human label for analytics shipping cards. */
export function analyticsShippingMethodLabel(
  method: AnalyticsShippingMethod,
): string {
  return SHIPPING_LABELS[method];
}

function averageOrderValue(revenue: number, orderCount: number): number {
  if (orderCount === 0) {
    return 0;
  }
  return Math.round((revenue / orderCount) * 100) / 100;
}

/**
 * Builds pickup/delivery rows for the selected analytics window.
 * Missing buckets default to zero so the UI always shows both methods.
 */
export function buildShippingBreakdown(
  byMethod: ReadonlyMap<AnalyticsShippingMethod, ShippingBreakdownMetrics>,
): ShippingBreakdownRow[] {
  return ANALYTICS_SHIPPING_METHODS.map((method) => {
    const metrics = byMethod.get(method) ?? {
      orderCount: 0,
      revenueAmount: 0,
    };
    return {
      method,
      orderCount: metrics.orderCount,
      revenueAmount: metrics.revenueAmount,
      averageOrderValue: averageOrderValue(
        metrics.revenueAmount,
        metrics.orderCount,
      ),
    };
  });
}

import { describe, expect, it } from "vitest";

import { buildPaymentBreakdown } from "./payment-breakdown";
import type { AnalyticsPaymentMethod } from "./payment-method-filter";

describe("buildPaymentBreakdown", () => {
  it("mirrors selected-range totals when a payment filter is active", () => {
    const byMethod = new Map<
      AnalyticsPaymentMethod,
      { orderCount: number; revenueAmount: number }
    >([
      ["cash", { orderCount: 10, revenueAmount: 1000 }],
      ["idram", { orderCount: 139, revenueAmount: 1_065_780 }],
      ["arca", { orderCount: 5, revenueAmount: 500 }],
    ]);

    expect(
      buildPaymentBreakdown({
        paymentMethod: "idram",
        selectedRange: { orderCount: 139, revenueAmount: 1_065_780 },
        byMethod,
      }),
    ).toEqual([
      {
        method: "idram",
        orderCount: 139,
        revenueAmount: 1_065_780,
        averageOrderValue: 7667.48,
      },
    ]);
  });

  it("returns all methods from the map when filter is all", () => {
    const byMethod = new Map<
      AnalyticsPaymentMethod,
      { orderCount: number; revenueAmount: number }
    >([
      ["cash", { orderCount: 2, revenueAmount: 200 }],
      ["idram", { orderCount: 1, revenueAmount: 100 }],
    ]);

    const rows = buildPaymentBreakdown({
      paymentMethod: "all",
      selectedRange: { orderCount: 3, revenueAmount: 300 },
      byMethod,
    });

    expect(rows).toEqual([
      {
        method: "cash",
        orderCount: 2,
        revenueAmount: 200,
        averageOrderValue: 100,
      },
      {
        method: "idram",
        orderCount: 1,
        revenueAmount: 100,
        averageOrderValue: 100,
      },
      {
        method: "arca",
        orderCount: 0,
        revenueAmount: 0,
        averageOrderValue: 0,
      },
    ]);
  });
});

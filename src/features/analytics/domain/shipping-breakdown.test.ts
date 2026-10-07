import { describe, expect, it } from "vitest";

import {
  buildShippingBreakdown,
  type AnalyticsShippingMethod,
} from "./shipping-breakdown";

describe("buildShippingBreakdown", () => {
  it("always returns pickup and delivery rows", () => {
    const byMethod = new Map<
      AnalyticsShippingMethod,
      { orderCount: number; revenueAmount: number }
    >([["pickup", { orderCount: 14, revenueAmount: 73_850 }]]);

    expect(buildShippingBreakdown(byMethod)).toEqual([
      {
        method: "pickup",
        orderCount: 14,
        revenueAmount: 73_850,
        averageOrderValue: 5275,
      },
      {
        method: "delivery",
        orderCount: 0,
        revenueAmount: 0,
        averageOrderValue: 0,
      },
    ]);
  });
});

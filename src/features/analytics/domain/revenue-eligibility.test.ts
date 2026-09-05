import { describe, expect, it } from "vitest";

import {
  DEFAULT_REVENUE_STATUSES,
  EXCLUDED_REVENUE_ORDER_STATUSES,
  isRevenueEligibleOrder,
} from "@/features/analytics/domain/revenue-eligibility";

describe("isRevenueEligibleOrder", () => {
  it("counts pending cash and confirmed online orders", () => {
    expect(
      isRevenueEligibleOrder({
        isArchived: false,
        status: "PENDING",
        paymentStatus: "PENDING",
      }),
    ).toBe(true);
    expect(
      isRevenueEligibleOrder({
        isArchived: false,
        status: "CONFIRMED",
        paymentStatus: "CAPTURED",
      }),
    ).toBe(true);
  });

  it("excludes negative fulfillment, failed payment, and archives", () => {
    expect(
      isRevenueEligibleOrder({
        isArchived: false,
        status: "CANCELLED",
        paymentStatus: "PENDING",
      }),
    ).toBe(false);
    expect(
      isRevenueEligibleOrder({
        isArchived: false,
        status: "PENDING",
        paymentStatus: "FAILED",
      }),
    ).toBe(false);
    expect(
      isRevenueEligibleOrder({
        isArchived: true,
        status: "DELIVERED",
        paymentStatus: "CAPTURED",
      }),
    ).toBe(false);
  });

  it("defaults to every non-negative fulfillment status", () => {
    expect(DEFAULT_REVENUE_STATUSES).toEqual([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
    ]);
    expect(EXCLUDED_REVENUE_ORDER_STATUSES).toEqual(["CANCELLED", "REFUNDED"]);
  });
});

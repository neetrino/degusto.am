import { describe, expect, it } from "vitest";

import { isOnlinePaymentAllowed } from "@/features/checkout/domain/payment-methods";

describe("isOnlinePaymentAllowed", () => {
  it("allows online payment for delivery", () => {
    expect(
      isOnlinePaymentAllowed({
        shippingMethod: "delivery",
        pickupBranchId: "bagratunyats-11a",
      }),
    ).toBe(true);
  });

  it("allows online payment for Paruyr Sevak pickup", () => {
    expect(
      isOnlinePaymentAllowed({
        shippingMethod: "pickup",
        pickupBranchId: "paruyr-sevak-92",
      }),
    ).toBe(true);
  });

  it("blocks online payment for Bagratunyats and Gai Avenue pickup", () => {
    expect(
      isOnlinePaymentAllowed({
        shippingMethod: "pickup",
        pickupBranchId: "bagratunyats-11a",
      }),
    ).toBe(false);
    expect(
      isOnlinePaymentAllowed({
        shippingMethod: "pickup",
        pickupBranchId: "gai-avenue-17-3",
      }),
    ).toBe(false);
  });
});

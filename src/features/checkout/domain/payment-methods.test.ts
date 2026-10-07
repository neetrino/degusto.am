import { describe, expect, it } from "vitest";

import { isCashPaymentAllowed } from "@/features/checkout/domain/payment-methods";

describe("isCashPaymentAllowed", () => {
  it("allows cash for delivery", () => {
    expect(
      isCashPaymentAllowed({
        shippingMethod: "delivery",
        pickupBranchId: "bagratunyats-11a",
      }),
    ).toBe(true);
  });

  it("allows cash for Paruyr Sevak pickup", () => {
    expect(
      isCashPaymentAllowed({
        shippingMethod: "pickup",
        pickupBranchId: "paruyr-sevak-92",
      }),
    ).toBe(true);
  });

  it("blocks cash for Bagratunyats and Gai Avenue pickup", () => {
    expect(
      isCashPaymentAllowed({
        shippingMethod: "pickup",
        pickupBranchId: "bagratunyats-11a",
      }),
    ).toBe(false);
    expect(
      isCashPaymentAllowed({
        shippingMethod: "pickup",
        pickupBranchId: "gai-avenue-17-3",
      }),
    ).toBe(false);
  });
});

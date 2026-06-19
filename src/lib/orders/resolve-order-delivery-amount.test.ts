import { describe, expect, it } from "vitest";
import { resolveOrderDeliveryAmount } from "./resolve-order-delivery-amount";

describe("resolveOrderDeliveryAmount", () => {
  it("prefers delivery price from order event", () => {
    expect(
      resolveOrderDeliveryAmount({
        shippingAmount: 1100,
        bagFeeAmount: 50,
        deliveryPriceFromEvent: 1050,
      })
    ).toBe(1050);
  });

  it("falls back to legacy combined shipping minus bag fee", () => {
    expect(
      resolveOrderDeliveryAmount({
        shippingAmount: 1100,
        bagFeeAmount: 50,
      })
    ).toBe(1050);
  });
});

import { describe, expect, it } from "vitest";

import { displayPaymentMethodLabel } from "./payment-method-display";

describe("displayPaymentMethodLabel", () => {
  it("maps known payment methods", () => {
    expect(displayPaymentMethodLabel("COD")).toBe("Cash");
    expect(displayPaymentMethodLabel("cash")).toBe("Cash");
    expect(displayPaymentMethodLabel("IDRAM")).toBe("Idram");
    expect(displayPaymentMethodLabel("arca")).toBe("ArCa");
  });

  it("falls back for empty or unknown values", () => {
    expect(displayPaymentMethodLabel(null)).toBe("—");
    expect(displayPaymentMethodLabel(undefined)).toBe("—");
    expect(displayPaymentMethodLabel("  ")).toBe("—");
    expect(displayPaymentMethodLabel("paypal")).toBe("paypal");
  });
});

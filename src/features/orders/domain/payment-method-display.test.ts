import { describe, expect, it } from "vitest";

import { displayPaymentMethodLabel } from "./payment-method-display";

describe("displayPaymentMethodLabel", () => {
  it("maps known payment methods", () => {
    expect(displayPaymentMethodLabel("COD")).toBe("cash");
    expect(displayPaymentMethodLabel("cash")).toBe("cash");
    expect(displayPaymentMethodLabel("cache")).toBe("cash");
    expect(displayPaymentMethodLabel("IDRAM")).toBe("idram");
    expect(displayPaymentMethodLabel("idram")).toBe("idram");
    expect(displayPaymentMethodLabel("arca")).toBe("arca");
    expect(displayPaymentMethodLabel("ARCA")).toBe("arca");
  });

  it("falls back for empty or unknown values", () => {
    expect(displayPaymentMethodLabel(null)).toBe("—");
    expect(displayPaymentMethodLabel(undefined)).toBe("—");
    expect(displayPaymentMethodLabel("  ")).toBe("—");
    expect(displayPaymentMethodLabel("paypal")).toBe("paypal");
  });
});

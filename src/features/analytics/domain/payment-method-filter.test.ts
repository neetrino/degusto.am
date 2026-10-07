import { describe, expect, it } from "vitest";

import {
  normalizeAnalyticsPaymentMethod,
  parseAnalyticsPaymentMethodFilter,
  paymentMethodDbAliases,
} from "./payment-method-filter";

describe("paymentMethodDbAliases", () => {
  it("includes legacy cash spellings", () => {
    expect(paymentMethodDbAliases("cash")).toEqual(["cash", "cod", "cache"]);
    expect(paymentMethodDbAliases("idram")).toEqual(["idram"]);
    expect(paymentMethodDbAliases("arca")).toEqual(["arca"]);
  });
});

describe("normalizeAnalyticsPaymentMethod", () => {
  it("normalizes known methods and legacy cash aliases", () => {
    expect(normalizeAnalyticsPaymentMethod("COD")).toBe("cash");
    expect(normalizeAnalyticsPaymentMethod("cache")).toBe("cash");
    expect(normalizeAnalyticsPaymentMethod("IDRAM")).toBe("idram");
    expect(normalizeAnalyticsPaymentMethod("arca")).toBe("arca");
  });

  it("maps missing or unknown methods to other", () => {
    expect(normalizeAnalyticsPaymentMethod(null)).toBe("other");
    expect(normalizeAnalyticsPaymentMethod("")).toBe("other");
    expect(normalizeAnalyticsPaymentMethod("paypal")).toBe("other");
  });
});

describe("parseAnalyticsPaymentMethodFilter", () => {
  it("accepts known filters and falls back to all", () => {
    expect(parseAnalyticsPaymentMethodFilter("cash")).toBe("cash");
    expect(parseAnalyticsPaymentMethodFilter("idram")).toBe("idram");
    expect(parseAnalyticsPaymentMethodFilter("arca")).toBe("arca");
    expect(parseAnalyticsPaymentMethodFilter("all")).toBe("all");
    expect(parseAnalyticsPaymentMethodFilter(undefined)).toBe("all");
    expect(parseAnalyticsPaymentMethodFilter("paypal")).toBe("all");
  });
});

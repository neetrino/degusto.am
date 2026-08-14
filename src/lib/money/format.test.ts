import { describe, expect, it } from "vitest";

import {
  formatGroupedInteger,
  formatMoneyAmount,
  formatStorefrontPrice,
} from "@/lib/money/format";

describe("formatGroupedInteger", () => {
  it("leaves numbers below 1000 ungrouped", () => {
    expect(formatGroupedInteger(20)).toBe("20");
    expect(formatGroupedInteger(999)).toBe("999");
  });

  it("groups thousands with dots", () => {
    expect(formatGroupedInteger(1_000)).toBe("1.000");
    expect(formatGroupedInteger(10_000)).toBe("10.000");
    expect(formatGroupedInteger(100_000)).toBe("100.000");
    expect(formatGroupedInteger(1_000_000)).toBe("1.000.000");
  });
});

describe("formatMoneyAmount", () => {
  it("formats AMD without fraction digits and with dotted thousands", () => {
    expect(formatMoneyAmount(12_500, "AMD", "hy")).toBe("12.500 AMD");
    expect(formatMoneyAmount(12_500, "AMD", "en")).toBe("12.500 AMD");
  });

  it("formats USD from minor units", () => {
    expect(formatMoneyAmount(2600n, "USD", "en")).toBe("26.00 USD");
  });

  it("is identical for the same amount across app locales (SSR-safe)", () => {
    const amount = 1_234;
    expect(formatMoneyAmount(amount, "AMD", "hy")).toBe(
      formatMoneyAmount(amount, "AMD", "en"),
    );
    expect(formatMoneyAmount(amount, "AMD", "hy")).toBe("1.234 AMD");
  });
});

describe("formatStorefrontPrice", () => {
  it("renders AMD with dotted grouping and dram suffix", () => {
    expect(
      formatStorefrontPrice({
        displayCurrency: "AMD",
        displayAmount: 2150n,
        formatted: "2.150 AMD",
      }),
    ).toBe("2.150 Դ");
  });

  it("keeps non-AMD formatted labels", () => {
    expect(
      formatStorefrontPrice({
        displayCurrency: "USD",
        displayAmount: 2600n,
        formatted: "26.00 USD",
      }),
    ).toBe("26.00 USD");
  });
});

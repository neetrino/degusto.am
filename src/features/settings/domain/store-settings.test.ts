import { describe, expect, it } from "vitest";

import {
  DEFAULT_FX_RATES,
  DEFAULT_REVENUE_STATUSES,
  DEFAULT_STOREFRONT_CURRENCIES,
  listEnabledStorefrontCurrencies,
  parseFxRates,
  parseMaintenance,
  parseRevenueStatuses,
  parseStacking,
  parseStorefrontCurrencies,
  resolveEnabledCurrency,
} from "@/features/settings/domain/store-settings";

describe("store settings parsers", () => {
  it("defaults revenue statuses safely", () => {
    expect(parseRevenueStatuses(null)).toEqual(DEFAULT_REVENUE_STATUSES);
    expect(parseRevenueStatuses({ statuses: ["PENDING", "DELIVERED", "CANCELLED"] })).toEqual([
      "PENDING",
      "DELIVERED",
    ]);
  });

  it("parses maintenance and stacking flags", () => {
    expect(parseMaintenance({ enabled: true, message: "Back soon" })).toEqual({
      enabled: true,
      message: "Back soon",
    });
    expect(parseStacking({ allowCouponWithAutomatic: true })).toEqual({
      allowCouponWithAutomatic: true,
    });
  });

  it("parses fx rates with defaults for invalid values", () => {
    expect(parseFxRates(null)).toEqual(DEFAULT_FX_RATES);
    expect(parseFxRates({ usd: "0.003", rub: "0.25" })).toEqual({
      usd: "0.003",
      rub: "0.25",
    });
    expect(parseFxRates({ usd: "0,2137", rub: "1,5" })).toEqual({
      usd: "0.2137",
      rub: "1.5",
    });
    expect(parseFxRates({ usd: "0", rub: "abc" })).toEqual(DEFAULT_FX_RATES);
  });

  it("parses storefront currencies and clamps selection", () => {
    expect(parseStorefrontCurrencies(null)).toEqual(
      DEFAULT_STOREFRONT_CURRENCIES,
    );
    expect(
      parseStorefrontCurrencies({ AMD: false, USD: false, RUB: false }),
    ).toEqual(DEFAULT_STOREFRONT_CURRENCIES);
    expect(
      parseStorefrontCurrencies({ AMD: true, USD: true, RUB: false }),
    ).toEqual({ AMD: true, USD: true, RUB: false });

    const flags = { AMD: true, USD: true, RUB: false } as const;
    expect(listEnabledStorefrontCurrencies(flags)).toEqual(["AMD", "USD"]);
    expect(resolveEnabledCurrency("USD", flags)).toBe("USD");
    expect(resolveEnabledCurrency("RUB", flags)).toBe("AMD");
  });
});

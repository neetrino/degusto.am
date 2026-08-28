import { describe, expect, it } from "vitest";

import {
  PRODUCT_DEFAULT_STOCK,
  PRODUCT_STOCK_REPLENISH_THRESHOLD,
  planStockAfterSale,
} from "./auto-stock";

describe("planStockAfterSale", () => {
  it("keeps deducted balance when above replenish threshold", () => {
    expect(planStockAfterSale(10_000, 3)).toEqual({
      orderBalance: 9_997,
      finalBalance: 9_997,
      replenishDelta: null,
    });
  });

  it("replenishes when balance hits the threshold exactly", () => {
    const sold = PRODUCT_DEFAULT_STOCK - PRODUCT_STOCK_REPLENISH_THRESHOLD;
    expect(planStockAfterSale(PRODUCT_DEFAULT_STOCK, sold)).toEqual({
      orderBalance: PRODUCT_STOCK_REPLENISH_THRESHOLD,
      finalBalance: PRODUCT_DEFAULT_STOCK,
      replenishDelta: PRODUCT_DEFAULT_STOCK - PRODUCT_STOCK_REPLENISH_THRESHOLD,
    });
  });

  it("replenishes when balance drops below the threshold", () => {
    expect(planStockAfterSale(1_005, 10)).toEqual({
      orderBalance: 995,
      finalBalance: PRODUCT_DEFAULT_STOCK,
      replenishDelta: PRODUCT_DEFAULT_STOCK - 995,
    });
  });
});

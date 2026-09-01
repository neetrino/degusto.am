import { describe, expect, it } from "vitest";

import {
  BAG_FEE_PER_CATEGORY_AMOUNT,
  calculateBagFeeAmount,
} from "@/features/checkout/domain/bag-fee";

describe("calculateBagFeeAmount", () => {
  it("charges 50 AMD per unique category", () => {
    expect(calculateBagFeeAmount(1)).toBe(BAG_FEE_PER_CATEGORY_AMOUNT);
    expect(calculateBagFeeAmount(2)).toBe(100);
    expect(calculateBagFeeAmount(3)).toBe(150);
    expect(calculateBagFeeAmount(5)).toBe(250);
  });

  it("returns 0 for empty or invalid counts", () => {
    expect(calculateBagFeeAmount(0)).toBe(0);
    expect(calculateBagFeeAmount(-1)).toBe(0);
    expect(calculateBagFeeAmount(Number.NaN)).toBe(0);
  });
});

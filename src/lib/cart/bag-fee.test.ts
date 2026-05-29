import { describe, expect, it } from "vitest";
import {
  BAG_FEE_PER_CATEGORY_AMD,
  calculateBagAmountByUniqueCategories,
  resolveBagCategoryKey,
} from "./bag-fee";

describe("resolveBagCategoryKey", () => {
  it("prioritizes stable identifiers before names", () => {
    const key = resolveBagCategoryKey({
      categoryId: "cat-1",
      category: { id: "cat-2", slug: "drinks", name: "Drinks" },
    });
    expect(key).toBe("cat-1");
  });

  it("falls back to category name when identifiers are missing", () => {
    const key = resolveBagCategoryKey({
      category: { name: "Dessert" },
    });
    expect(key).toBe("Dessert");
  });
});

describe("calculateBagAmountByUniqueCategories", () => {
  it("returns 0 for empty carts", () => {
    expect(calculateBagAmountByUniqueCategories([], () => null)).toBe(0);
  });

  it("charges once for repeated products in same category", () => {
    const items = [
      { product: { categoryId: "drinks" } },
      { product: { categoryId: "drinks" } },
      { product: { categoryId: "drinks" } },
    ];
    const amount = calculateBagAmountByUniqueCategories(items, (item) => item.product);
    expect(amount).toBe(BAG_FEE_PER_CATEGORY_AMD);
  });

  it("charges per unique category regardless of quantity", () => {
    const items = [
      { product: { categoryId: "drinks" }, quantity: 3 },
      { product: { categoryId: "food" }, quantity: 1 },
      { product: { categoryId: "dessert" }, quantity: 7 },
    ];
    const amount = calculateBagAmountByUniqueCategories(items, (item) => item.product);
    expect(amount).toBe(BAG_FEE_PER_CATEGORY_AMD * 3);
  });

  it("ignores items without a valid category identifier", () => {
    const items = [
      { product: { categoryId: "drinks" } },
      { product: { categoryId: "   " } },
      { product: {} },
    ];
    const amount = calculateBagAmountByUniqueCategories(items, (item) => item.product);
    expect(amount).toBe(BAG_FEE_PER_CATEGORY_AMD);
  });
});

import { describe, expect, it } from "vitest";

import { buildCatalogHref } from "@/features/products/ui/shop/build-catalog-href";

describe("buildCatalogHref", () => {
  it("sends combo categories to the combo route", () => {
    expect(buildCatalogHref("hy", { category: "combo" })).toBe("/hy/combo");
    expect(buildCatalogHref("hy", { category: "combo-packages" })).toBe(
      "/hy/combo",
    );
    expect(buildCatalogHref("hy", { category: "Կոմբո փաթեթներ" })).toBe(
      "/hy/combo",
    );
  });

  it("keeps other categories on the shop catalog", () => {
    expect(buildCatalogHref("hy", { category: "pizza" })).toBe(
      "/hy/products?category=pizza",
    );
  });
});

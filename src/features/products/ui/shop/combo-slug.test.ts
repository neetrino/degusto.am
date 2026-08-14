import { describe, expect, it } from "vitest";

import {
  isComboSlug,
  resolveComboCatalogSlug,
} from "@/features/products/ui/shop/combo-slug";

describe("isComboSlug", () => {
  it("matches canonical and catalog combo slugs", () => {
    expect(isComboSlug("combo")).toBe(true);
    expect(isComboSlug("combos")).toBe(true);
    expect(isComboSlug("combo-packages")).toBe(true);
    expect(isComboSlug("combo-paketner")).toBe(true);
    expect(isComboSlug("Combo-Packages")).toBe(true);
    expect(isComboSlug("Կոմբո փաթեթներ")).toBe(true);
  });

  it("rejects unrelated category slugs", () => {
    expect(isComboSlug("pizza")).toBe(false);
    expect(isComboSlug("all")).toBe(false);
    expect(isComboSlug("")).toBe(false);
  });
});

describe("resolveComboCatalogSlug", () => {
  it("maps combo route alias to the live catalog slug", () => {
    expect(
      resolveComboCatalogSlug("combo", ["pizza", "combo-packages", "soups"]),
    ).toBe("combo-packages");
    expect(
      resolveComboCatalogSlug("combo", ["pizza", "Կոմբո փաթեթներ"]),
    ).toBe("Կոմբո փաթեթներ");
  });

  it("leaves non-combo slugs unchanged", () => {
    expect(resolveComboCatalogSlug("pizza", ["pizza", "combo-packages"])).toBe(
      "pizza",
    );
  });
});

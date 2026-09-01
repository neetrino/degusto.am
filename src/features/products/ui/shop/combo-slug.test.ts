import { describe, expect, it } from "vitest";

import { isComboSlug } from "@/features/products/ui/shop/combo-slug";

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


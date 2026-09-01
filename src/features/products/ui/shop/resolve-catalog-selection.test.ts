import { describe, expect, it } from "vitest";

import { resolveCatalogSelection } from "@/features/products/ui/shop/resolve-catalog-selection";

const grill = {
  id: "cat-grill",
  slug: "grill-and-smoked-products",
  title: "Grill",
  aliases: ["գրիլ-եւ-ապխտած-արտադրանքներ"],
};

describe("resolveCatalogSelection", () => {
  it("308s Unicode category params to the English slug", () => {
    const selection = resolveCatalogSelection(
      "hy",
      "գրիլ-եւ-ապխտած-արտադրանքներ",
      [grill],
      { page: 2 },
    );

    expect(selection.categoryId).toBe("cat-grill");
    expect(selection.selectedSlug).toBe("grill-and-smoked-products");
    expect(selection.canonicalHref).toBe(
      "/hy/products?category=grill-and-smoked-products&page=2",
    );
  });

  it("sends catalog combo slugs to /combo without looping on the combo route", () => {
    const combo = {
      id: "cat-combo",
      slug: "combo-packages",
      title: "Combos",
      aliases: ["կոմբո-փաթեթներ"],
    };

    expect(
      resolveCatalogSelection("hy", "combo-packages", [combo], {}).canonicalHref,
    ).toBe("/hy/combo");
    expect(
      resolveCatalogSelection("hy", "combo", [combo], {}).canonicalHref,
    ).toBeNull();
  });

  it("keeps an already canonical English slug", () => {
    const selection = resolveCatalogSelection(
      "hy",
      "grill-and-smoked-products",
      [grill],
      {},
    );

    expect(selection.canonicalHref).toBeNull();
    expect(selection.selectedSlug).toBe("grill-and-smoked-products");
  });
});

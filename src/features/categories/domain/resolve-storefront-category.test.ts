import { describe, expect, it } from "vitest";

import {
  resolveStorefrontCategory,
  shouldCanonicalizeCategoryParam,
} from "@/features/categories/domain/resolve-storefront-category";

const grill = {
  id: "cat-grill",
  slug: "grill-and-smoked-products",
  title: "Grill category",
  aliases: ["գրիլ-եւ-ապխտած-արտադրանքներ"],
};

const combo = {
  id: "cat-combo",
  slug: "combo-packages",
  title: "Combo packages",
  aliases: ["կոմբո-փաթեթներ"],
};

describe("resolveStorefrontCategory", () => {
  it("matches the canonical English slug and legacy Unicode slugs", () => {
    expect(
      resolveStorefrontCategory([grill], "grill-and-smoked-products")?.id,
    ).toBe("cat-grill");
    expect(
      resolveStorefrontCategory([grill], "գրիլ-եւ-ապխտած-արտադրանքներ")?.id,
    ).toBe("cat-grill");
  });

  it("maps combo aliases to the combo category", () => {
    expect(resolveStorefrontCategory([grill, combo], "combo")?.id).toBe(
      "cat-combo",
    );
  });
});

describe("shouldCanonicalizeCategoryParam", () => {
  it("rewrites Unicode category params and keeps combo/all", () => {
    expect(
      shouldCanonicalizeCategoryParam(
        "գրիլ-եւ-ապխտած-արտադրանքներ",
        "grill-and-smoked-products",
      ),
    ).toBe(true);
    expect(shouldCanonicalizeCategoryParam("combo", "combo-packages")).toBe(
      false,
    );
    expect(shouldCanonicalizeCategoryParam("all", "pizza")).toBe(false);
  });
});

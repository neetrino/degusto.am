import { describe, expect, it } from "vitest";

import {
  canonicalCategorySlug,
  suggestEnglishCategorySlug,
} from "@/features/categories/domain/canonical-category-slug";

describe("suggestEnglishCategorySlug", () => {
  it("maps the live Degusto grill category to an English slug", () => {
    expect(suggestEnglishCategorySlug("Գրիլ եւ ապխտած արտադրանքներ")).toBe(
      "grill-smoked",
    );
  });

  it("keeps bar and bar-alcohol distinct", () => {
    expect(suggestEnglishCategorySlug("Բար")).toBe("bar");
    expect(suggestEnglishCategorySlug("Բար (Ալկոհոլ)")).toBe("bar-alcohol");
  });

  it("can map two potato titles to the same English slug", () => {
    expect(suggestEnglishCategorySlug("Stuffed potato")).toBe("stuffed-potato");
    expect(suggestEnglishCategorySlug("Potato")).toBe("stuffed-potato");
  });
});

describe("canonicalCategorySlug", () => {
  it("prefers a stored ASCII slug over title mapping", () => {
    expect(
      canonicalCategorySlug({
        en: { title: "Pizza", slug: "wood-fired-pizza" },
        hy: { title: "Pizza", slug: "pitsa-hy" },
      }),
    ).toBe("wood-fired-pizza");
  });

  it("uses the English catalog name when stored slugs are Unicode", () => {
    expect(
      canonicalCategorySlug({
        hy: {
          title: "Գրիլ եւ ապխտած արտադրանքներ",
          slug: "գրիլ-եւ-ապխտած-արտադրանքներ",
        },
        en: {
          title: "Գրիլ եւ ապխտած արտադրանքներ",
          slug: "գրիլ-եւ-ապխտած-արտադրանքներ",
        },
      }),
    ).toBe("grill-smoked");
  });
});

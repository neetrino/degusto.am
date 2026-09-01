import { describe, expect, it } from "vitest";

import {
  collectStoredSlugs,
  isAsciiSlug,
  pickCanonicalUrlSlug,
  pickStoredAsciiSlug,
  slugifyToAscii,
} from "@/lib/seo/url-slug";

describe("slugifyToAscii", () => {
  it("keeps English titles as kebab-case", () => {
    expect(slugifyToAscii("Grill and Smoked Products")).toBe(
      "grill-and-smoked-products",
    );
  });

  it("transliterates Armenian instead of leaving Unicode", () => {
    const slug = slugifyToAscii("Գրիլ եւ ապխտած արտադրանքներ");
    expect(isAsciiSlug(slug)).toBe(true);
    expect(slug.startsWith("gril-")).toBe(true);
  });

  it("transliterates Russian", () => {
    expect(slugifyToAscii("Гриль и копчёные продукты")).toBe(
      "gril-i-kopchenye-produkty",
    );
  });
});

describe("pickCanonicalUrlSlug", () => {
  it("prefers the English ASCII slug", () => {
    expect(
      pickCanonicalUrlSlug(
        {
          hy: { title: "Պիցցա", slug: "պիցցա" },
          en: { title: "Pizza", slug: "pizza" },
          ru: { title: "Пицца", slug: "pitstsa" },
        },
        "category",
      ),
    ).toBe("pizza");
  });

  it("slugifies the English title when stored slugs are Unicode", () => {
    expect(
      pickCanonicalUrlSlug(
        {
          hy: {
            title: "Գրիլ եւ ապխտած արտադրանքներ",
            slug: "գրիլ-եւ-ապխտած-արտադրանքներ",
          },
          en: {
            title: "Grill and smoked products",
            slug: "գրիլ-եւ-ապխտած-արտադրանքներ",
          },
        },
        "category",
      ),
    ).toBe("grill-and-smoked-products");
  });

  it("derives an ASCII slug when every stored slug is Unicode", () => {
    const slug = pickCanonicalUrlSlug(
      {
        hy: { title: "Պեստո պիցցա", slug: "պեստո-պիցցա" },
        en: { title: "Pesto pizza", slug: "պեստո-պիցցա" },
      },
      "product",
    );
    expect(isAsciiSlug(slug)).toBe(true);
    expect(slug).toBe("pesto-pizza");
  });
});

describe("pickStoredAsciiSlug", () => {
  it("returns null when no locale has an ASCII slug", () => {
    expect(
      pickStoredAsciiSlug({
        hy: { slug: "պիցցա" },
        en: { slug: "պիցցա" },
      }),
    ).toBeNull();
  });
});

describe("collectStoredSlugs", () => {
  it("collects distinct stored slugs for legacy matching", () => {
    expect(
      collectStoredSlugs({
        hy: { slug: "պիցցա" },
        en: { slug: "pizza" },
        ru: { slug: "պիցցա" },
      }),
    ).toEqual(["pizza", "պիցցա"]);
  });
});

describe("isAsciiSlug", () => {
  it("accepts kebab-case and rejects percent-encoded Unicode", () => {
    expect(isAsciiSlug("grill-and-smoked")).toBe(true);
    expect(isAsciiSlug("գրիլ-եւ-ապխտած")).toBe(false);
  });
});

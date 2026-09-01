import { describe, expect, it } from "vitest";

import { uniquifySlugs } from "@/lib/seo/uniquify-slugs";

describe("uniquifySlugs", () => {
  it("keeps unique slugs and suffixes collisions", () => {
    expect(
      uniquifySlugs([
        { id: "a", slug: "grill-smoked" },
        { id: "b", slug: "pizza" },
        { id: "c", slug: "grill-smoked" },
      ]),
    ).toEqual([
      { id: "a", slug: "grill-smoked" },
      { id: "b", slug: "pizza" },
      { id: "c", slug: "grill-smoked-2" },
    ]);
  });
});

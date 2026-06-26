import { describe, expect, it } from "vitest";
import { buildColorSizeVariantWhere } from "./attribute-variant-filters";

describe("buildColorSizeVariantWhere", () => {
  it("returns null when no color or size filters are active", () => {
    expect(buildColorSizeVariantWhere({})).toBeNull();
    expect(buildColorSizeVariantWhere({ colors: "", sizes: "" })).toBeNull();
    expect(buildColorSizeVariantWhere({ colors: "undefined", sizes: "null" })).toBeNull();
  });

  it("builds a published variant filter for color only", () => {
    const where = buildColorSizeVariantWhere({ colors: "black,red", lang: "hy" });
    expect(where).toEqual({
      variants: {
        some: {
          AND: [
            { published: true },
            {
              options: {
                some: {
                  OR: expect.arrayContaining([
                    { attributeKey: "color", value: { equals: "black", mode: "insensitive" } },
                    { attributeKey: "color", value: { equals: "red", mode: "insensitive" } },
                  ]),
                },
              },
            },
          ],
        },
      },
    });
  });

  it("requires color and size on the same variant when both filters are set", () => {
    const where = buildColorSizeVariantWhere({ colors: "blue", sizes: "m,l", lang: "en" });
    const variantAnd = where?.variants?.some;
    expect(variantAnd && "AND" in variantAnd ? variantAnd.AND : null).toHaveLength(3);
  });
});

import { describe, expect, it } from "vitest";
import {
  buildProductSearchWhere,
  mergeProductSearchIntoWhere,
  normalizeProductSearchTerm,
} from "./search-filter";

describe("buildProductSearchWhere", () => {
  it("returns empty predicate for blank input", () => {
    expect(buildProductSearchWhere("")).toEqual({});
    expect(buildProductSearchWhere("   ")).toEqual({});
  });

  it("matches title, subtitle, and sku with trimmed term", () => {
    const where = buildProductSearchWhere("  pizza  ");
    expect(where.OR).toHaveLength(3);
    expect(where.OR?.[0]).toEqual({
      translations: {
        some: {
          title: { contains: "pizza", mode: "insensitive" },
        },
      },
    });
    expect(where.OR?.[1]).toEqual({
      translations: {
        some: {
          subtitle: { contains: "pizza", mode: "insensitive" },
        },
      },
    });
    expect(where.OR?.[2]).toEqual({
      variants: {
        some: {
          sku: { contains: "pizza", mode: "insensitive" },
        },
      },
    });
  });
});

describe("mergeProductSearchIntoWhere", () => {
  const baseWhere = { published: true, deletedAt: null };

  it("leaves base where unchanged when search is empty", () => {
    expect(mergeProductSearchIntoWhere(baseWhere, undefined)).toEqual(baseWhere);
    expect(mergeProductSearchIntoWhere(baseWhere, "  ")).toEqual(baseWhere);
  });

  it("ANDs search OR-clause with existing filters", () => {
    const merged = mergeProductSearchIntoWhere(baseWhere, "burger");
    expect(merged.published).toBe(true);
    expect(merged.deletedAt).toBeNull();
    expect(merged.OR).toHaveLength(3);
  });
});

describe("normalizeProductSearchTerm", () => {
  it("trims whitespace", () => {
    expect(normalizeProductSearchTerm("  abc  ")).toBe("abc");
  });
});

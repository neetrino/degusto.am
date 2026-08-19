import { describe, expect, it } from "vitest";

import {
  CATEGORIES_PER_PAGE,
  categoryLogicalPageCount,
  categoryLoopItemIndex,
  logicalCategoryPage,
  settledCategoryLoopIndex,
  wrapCategoryLoopIndex,
} from "@/features/home/ui/home-mobile-categories-loop";

describe("categoryLogicalPageCount", () => {
  it("uses at least one full page when items exist", () => {
    expect(categoryLogicalPageCount(2)).toBe(1);
    expect(categoryLogicalPageCount(5)).toBe(1);
    expect(categoryLogicalPageCount(12)).toBe(3);
  });
});

describe("categoryLoopItemIndex", () => {
  it("fills a short list by wrapping so each page has five slots", () => {
    const slots = Array.from({ length: CATEGORIES_PER_PAGE }, (_, slot) =>
      categoryLoopItemIndex(2, 0, slot),
    );
    expect(slots).toEqual([0, 1, 0, 1, 0]);
  });

  it("wraps leftover slots on the last page from the start", () => {
    const slots = Array.from({ length: CATEGORIES_PER_PAGE }, (_, slot) =>
      categoryLoopItemIndex(12, 2, slot),
    );
    expect(slots).toEqual([10, 11, 0, 1, 2]);
  });
});

describe("wrapCategoryLoopIndex", () => {
  it("teleports first and third copies onto the middle copy", () => {
    expect(wrapCategoryLoopIndex(0, 3)).toEqual({ index: 3, jumped: true });
    expect(wrapCategoryLoopIndex(8, 3)).toEqual({ index: 5, jumped: true });
    expect(wrapCategoryLoopIndex(4, 3)).toEqual({ index: 4, jumped: false });
  });
});

describe("logicalCategoryPage", () => {
  it("maps a middle-copy index to the real page", () => {
    expect(logicalCategoryPage(5, 3)).toBe(2);
  });
});

describe("settledCategoryLoopIndex", () => {
  it("returns the nearest page only when the scroller has snapped", () => {
    expect(settledCategoryLoopIndex(320, 320)).toBe(1);
    expect(settledCategoryLoopIndex(200, 320)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";

import {
  shouldCommitCatalogSearch,
  shouldCommitCatalogSearchImmediately,
  shouldScheduleCatalogSearch,
} from "@/features/products/ui/shop/use-debounced-catalog-search";

describe("shouldCommitCatalogSearch", () => {
  it("skips when draft matches the committed query", () => {
    expect(shouldCommitCatalogSearch("pizza", "pizza")).toBe(false);
    expect(shouldCommitCatalogSearch("  pizza  ", "pizza")).toBe(false);
    expect(shouldCommitCatalogSearch("", "")).toBe(false);
    expect(shouldCommitCatalogSearch("   ", "")).toBe(false);
  });

  it("commits when the user types or clears the query", () => {
    expect(shouldCommitCatalogSearch("pi", "")).toBe(true);
    expect(shouldCommitCatalogSearch("", "pizza")).toBe(true);
    expect(shouldCommitCatalogSearch("pasta", "pizza")).toBe(true);
  });
});

describe("shouldCommitCatalogSearchImmediately", () => {
  it("clears an active search without waiting", () => {
    expect(shouldCommitCatalogSearchImmediately("", "pizza")).toBe(true);
    expect(shouldCommitCatalogSearchImmediately("   ", "pizza")).toBe(true);
  });

  it("keeps typed queries on the debounce path", () => {
    expect(shouldCommitCatalogSearchImmediately("pi", "")).toBe(false);
    expect(shouldCommitCatalogSearchImmediately("pasta", "pizza")).toBe(false);
    expect(shouldCommitCatalogSearchImmediately("", "")).toBe(false);
  });
});

describe("shouldScheduleCatalogSearch", () => {
  it("ignores URL sync from a field the user is not editing", () => {
    expect(shouldScheduleCatalogSearch("", "pizza", false)).toBe(false);
    expect(shouldScheduleCatalogSearch("pizza", "", false)).toBe(false);
  });

  it("schedules one commit after the user edits this field", () => {
    expect(shouldScheduleCatalogSearch("pizza", "", true)).toBe(true);
    expect(shouldScheduleCatalogSearch("", "pizza", true)).toBe(true);
    expect(shouldScheduleCatalogSearch("pizza", "pizza", true)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  isProductUniqueViolation,
  uniqueConstraintMessage,
} from "@/features/products/domain/unique-constraint";

describe("isProductUniqueViolation", () => {
  it("detects nested Drizzle/Neon unique violations", () => {
    const inner = new Error(
      'duplicate key value violates unique constraint "products_slug_hy_uidx"',
    );
    const outer = new Error("Failed query: insert into products");
    (outer as Error & { cause: Error }).cause = inner;

    expect(isProductUniqueViolation(outer)).toBe(true);
    expect(uniqueConstraintMessage(outer)).toBe(
      "A product with this title/slug already exists.",
    );
  });

  it("detects SKU unique index on the cause chain", () => {
    const inner = new Error(
      'duplicate key value violates unique constraint "products_sku_uidx"',
    );
    const outer = new Error("Failed query: insert into products");
    (outer as Error & { cause: Error }).cause = inner;

    expect(uniqueConstraintMessage(outer)).toBe(
      "A product with this SKU already exists.",
    );
  });

  it("rejects unrelated errors", () => {
    expect(isProductUniqueViolation(new Error("connection refused"))).toBe(
      false,
    );
  });
});

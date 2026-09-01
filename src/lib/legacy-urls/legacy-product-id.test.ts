import { describe, expect, it } from "vitest";

import {
  legacyProductCatalogPath,
  legacyProductDetailPath,
  parseLegacyProductId,
} from "./legacy-product-id";

describe("parseLegacyProductId", () => {
  it("accepts the live numeric id shape and rejects slugs", () => {
    expect(parseLegacyProductId("1293")).toBe("1293");
    expect(parseLegacyProductId(" 1007 ")).toBe("1007");
    expect(parseLegacyProductId("fQfUBT91OYl7")).toBeNull();
    expect(parseLegacyProductId("12.5")).toBeNull();
    expect(parseLegacyProductId("")).toBeNull();
  });
});

describe("legacy product destinations", () => {
  it("builds catalog and PDP paths without sending anyone home", () => {
    expect(legacyProductCatalogPath("hy")).toBe("/hy/products");
    expect(legacyProductCatalogPath("en")).toBe("/en/products");
    expect(legacyProductDetailPath("hy", "degusto-pizza")).toBe(
      "/hy/products/degusto-pizza",
    );
  });
});

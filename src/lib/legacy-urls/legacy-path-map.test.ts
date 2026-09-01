import { describe, expect, it } from "vitest";

import {
  buildLegacyNextRedirects,
  isUnprefixedLegacyProductIdPath,
  LEGACY_CATEGORY_DESTINATIONS,
  resolveLegacyRedirect,
} from "./legacy-path-map";

describe("resolveLegacyRedirect", () => {
  it("maps static section paths with and without a locale prefix", () => {
    expect(resolveLegacyRedirect("/about-us")).toBe("/hy/about");
    expect(resolveLegacyRedirect("/en/contact-us")).toBe("/en/contact");
    expect(resolveLegacyRedirect("/basket/")).toBe("/hy/cart");
    expect(resolveLegacyRedirect("/ru/terms-conditions")).toBe("/ru/legal/terms");
    expect(resolveLegacyRedirect("/privacy-policy")).toBe("/hy/legal/privacy");
    expect(resolveLegacyRedirect("/return")).toBe("/hy/legal/returns");
    expect(resolveLegacyRedirect("/login")).toBe("/hy/login");
    expect(resolveLegacyRedirect("/register")).toBe("/hy/register");
    expect(resolveLegacyRedirect("/hy/login")).toBeNull();
    expect(resolveLegacyRedirect("/en/register")).toBeNull();
  });

  it("maps language switcher paths, including old am → hy", () => {
    expect(resolveLegacyRedirect("/language/en")).toBe("/en");
    expect(resolveLegacyRedirect("/language/ru")).toBe("/ru");
    expect(resolveLegacyRedirect("/language/am")).toBe("/hy");
    expect(resolveLegacyRedirect("/en/language/am")).toBe("/hy");
  });

  it("maps known shop category ids and falls back unknown ids to catalog", () => {
    expect(resolveLegacyRedirect("/shop", new URLSearchParams("category=14"))).toBe(
      "/hy/products?category=grill-smoked",
    );
    expect(
      resolveLegacyRedirect("/en/shop", new URLSearchParams("category=12")),
    ).toBe("/en/combo");
    expect(
      resolveLegacyRedirect("/shop", new URLSearchParams("category=999")),
    ).toBe("/hy/products");
    expect(resolveLegacyRedirect("/shop")).toBe("/hy/products");
  });

  it("sends leftover shop paths to the catalog, never home", () => {
    expect(resolveLegacyRedirect("/shop/old-filter")).toBe("/hy/products");
    expect(resolveLegacyRedirect("/ru/shop/foo/bar")).toBe("/ru/products");
  });

  it("does not statically resolve /product/:id; leftover product paths go to catalog", () => {
    expect(resolveLegacyRedirect("/product/1293")).toBeNull();
    expect(resolveLegacyRedirect("/hy/product/1293")).toBeNull();
    expect(resolveLegacyRedirect("/product")).toBe("/hy/products");
    expect(resolveLegacyRedirect("/product/abc")).toBe("/hy/products");
    expect(resolveLegacyRedirect("/en/product/1293/extra")).toBe("/en/products");
  });

  it("does not touch payment callback paths or current storefront routes", () => {
    expect(resolveLegacyRedirect("/idram")).toBeNull();
    expect(resolveLegacyRedirect("/idram/success")).toBeNull();
    expect(resolveLegacyRedirect("/inecobank/result")).toBeNull();
    expect(resolveLegacyRedirect("/pay-by-fastshift/callback")).toBeNull();
    expect(resolveLegacyRedirect("/hy/products")).toBeNull();
    expect(resolveLegacyRedirect("/")).toBeNull();
  });
});

describe("isUnprefixedLegacyProductIdPath", () => {
  it("matches only unprefixed numeric product ids", () => {
    expect(isUnprefixedLegacyProductIdPath("/product/1293")).toBe(true);
    expect(isUnprefixedLegacyProductIdPath("/hy/product/1293")).toBe(false);
    expect(isUnprefixedLegacyProductIdPath("/product/abc")).toBe(false);
    expect(isUnprefixedLegacyProductIdPath("/product/1293/x")).toBe(false);
  });
});

describe("buildLegacyNextRedirects", () => {
  it("emits permanent category has-rules before the generic /shop fallback", () => {
    const redirects = buildLegacyNextRedirects();
    const grill = redirects.find(
      (rule) =>
        rule.source === "/shop" &&
        rule.has?.[0]?.value === "14" &&
        rule.destination === "/hy/products?category=grill-smoked",
    );
    const genericShop = redirects.find(
      (rule) =>
        rule.source === "/shop" &&
        !rule.has &&
        rule.destination === "/hy/products",
    );
    expect(grill).toBeDefined();
    expect(genericShop).toBeDefined();
    expect(redirects.indexOf(grill!)).toBeLessThan(redirects.indexOf(genericShop!));
    expect(grill?.permanent).toBe(true);
  });

  it("covers every mapped category id and does not add /product/:id", () => {
    const redirects = buildLegacyNextRedirects();
    const categoryIds = Object.keys(LEGACY_CATEGORY_DESTINATIONS);
    for (const id of categoryIds) {
      expect(
        redirects.some(
          (rule) => rule.source === "/shop" && rule.has?.[0]?.value === id,
        ),
      ).toBe(true);
    }
    expect(redirects.some((rule) => rule.source.includes("/product/"))).toBe(
      false,
    );
  });
});

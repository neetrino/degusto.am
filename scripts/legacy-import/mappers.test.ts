import { describe, expect, it } from "vitest";

import { applyRefusal } from "./apply-guard";
import {
  guestEmail,
  mapOrderStatus,
  mapPayment,
  mapRole,
  orderNumber,
  preferProductTitle,
  resolveProductSku,
} from "./mappers";

describe("mapRole", () => {
  it("maps admin to ADMIN and everyone else to CUSTOMER", () => {
    expect(mapRole("admin")).toBe("ADMIN");
    expect(mapRole("user")).toBe("CUSTOMER");
    expect(mapRole("dispatcher")).toBe("CUSTOMER");
    expect(mapRole("moderator")).toBe("CUSTOMER");
  });
});

describe("mapOrderStatus", () => {
  it("cancels status 4 regardless of method", () => {
    expect(mapOrderStatus("idram", "4")).toEqual({
      orderStatus: "CANCELLED",
      paymentStatus: "CANCELLED",
    });
    expect(mapOrderStatus("cash", "4")).toEqual({
      orderStatus: "CANCELLED",
      paymentStatus: "CANCELLED",
    });
  });

  it("maps online methods by paid flag", () => {
    expect(mapOrderStatus("idram", "1")).toEqual({
      orderStatus: "CONFIRMED",
      paymentStatus: "CAPTURED",
    });
    expect(mapOrderStatus("inecobank", "0")).toEqual({
      orderStatus: "CANCELLED",
      paymentStatus: "FAILED",
    });
    expect(mapOrderStatus("FastShift", "1")).toEqual({
      orderStatus: "CONFIRMED",
      paymentStatus: "CAPTURED",
    });
  });

  it("maps cash and null like cash", () => {
    expect(mapOrderStatus("cash", "1")).toEqual({
      orderStatus: "CONFIRMED",
      paymentStatus: "PENDING",
    });
    expect(mapOrderStatus("cash", "0")).toEqual({
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
    });
    expect(mapOrderStatus(null, "0")).toEqual({
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
    });
  });
});

describe("mapPayment", () => {
  it("maps known providers", () => {
    expect(mapPayment("idram")).toEqual({ provider: "idram", method: "idram" });
    expect(mapPayment("inecobank")).toEqual({
      provider: "arca",
      method: "arca",
    });
    expect(mapPayment("FastShift")).toEqual({
      provider: "fastshift",
      method: "fastshift",
    });
    expect(mapPayment("cash")).toEqual({ provider: "cod", method: "cash" });
    expect(mapPayment(null)).toEqual({ provider: "cod", method: "cash" });
  });
});

describe("guestEmail and orderNumber", () => {
  it("builds stable guest emails and o-prefixed numbers", () => {
    expect(guestEmail(42)).toBe("guest-42@guest.import.local");
    expect(orderNumber(100)).toBe("o100");
  });
});

describe("resolveProductSku", () => {
  const products = [
    { id: "p-exact", sku: "abc123" },
    { id: "p-suffix", sku: "def456-99" },
    { id: "p-prefix-b", sku: "ghi789-200" },
    { id: "p-prefix-a", sku: "ghi789-100" },
  ];

  it("matches exact sku, then code-id suffix, then prefix", () => {
    expect(resolveProductSku("abc123", 1, products)).toEqual({
      productId: "p-exact",
      match: "exact",
    });
    expect(resolveProductSku("def456", 99, products)).toEqual({
      productId: "p-suffix",
      match: "suffix",
    });
    expect(resolveProductSku("ghi789", 1, products)).toEqual({
      productId: "p-prefix-a",
      match: "prefix",
    });
    expect(resolveProductSku("missing", 1343, products)).toEqual({
      productId: null,
      match: "miss",
    });
  });
});

describe("preferProductTitle", () => {
  it("prefers en then am", () => {
    expect(
      preferProductTitle('{"am":"Հայերեն","en":"English","ru":"Русский"}'),
    ).toBe("English");
    expect(preferProductTitle('{"am":"Հայերեն","ru":"Русский"}')).toBe(
      "Հայերեն",
    );
  });
});

describe("applyRefusal", () => {
  it("allows dry-run without env and refuses --apply unless YES", () => {
    expect(applyRefusal([], undefined)).toBeNull();
    expect(applyRefusal(["--apply"], undefined)).toContain("LEGACY_IMPORT_APPLY");
    expect(applyRefusal(["--apply"], "YES")).toBeNull();
  });
});

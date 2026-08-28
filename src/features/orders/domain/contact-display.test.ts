import { describe, expect, it } from "vitest";

import { displayOrderContactName } from "./contact-display";

describe("displayOrderContactName", () => {
  it("keeps real names", () => {
    expect(displayOrderContactName("Ani Sargsyan", "37477000000")).toBe(
      "Ani Sargsyan",
    );
  });

  it("replaces Guest with phone when available", () => {
    expect(displayOrderContactName("Guest", "37494601039")).toBe("37494601039");
    expect(displayOrderContactName("guest", "+374 94 601039")).toBe(
      "+374 94 601039",
    );
  });

  it("falls back safely when phone is missing", () => {
    expect(displayOrderContactName("Guest", null)).toBe("Guest");
    expect(displayOrderContactName("Guest", "unknown")).toBe("Guest");
    expect(displayOrderContactName("  ", null)).toBe("Customer");
  });
});

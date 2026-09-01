import { describe, expect, it } from "vitest";

import {
  ORDERING_TIME_ZONE,
  isOrderingOpen,
} from "./ordering-hours";

/** Yerevan is UTC+4 year-round; these instants pin the legacy 09:00–23:59 window. */
function atYerevan(isoUtc: string): Date {
  return new Date(isoUtc);
}

describe("isOrderingOpen", () => {
  it("is closed before 09:00 Yerevan", () => {
    expect(isOrderingOpen(atYerevan("2026-09-01T04:59:59.000Z"))).toBe(false);
  });

  it("opens at 09:00:00 Yerevan", () => {
    expect(isOrderingOpen(atYerevan("2026-09-01T05:00:00.000Z"))).toBe(true);
  });

  it("stays open through 23:58:59 Yerevan", () => {
    expect(isOrderingOpen(atYerevan("2026-09-01T19:58:59.000Z"))).toBe(true);
  });

  it("closes at 23:59:00 Yerevan", () => {
    expect(isOrderingOpen(atYerevan("2026-09-01T19:59:00.000Z"))).toBe(false);
  });

  it("stays closed at midnight Yerevan", () => {
    expect(isOrderingOpen(atYerevan("2026-08-31T20:00:00.000Z"))).toBe(false);
  });

  it("stays closed in the early morning", () => {
    expect(isOrderingOpen(atYerevan("2026-09-01T00:10:00.000Z"))).toBe(false);
  });

  it("uses the given time zone when overridden", () => {
    const noonUtc = atYerevan("2026-09-01T12:00:00.000Z");
    expect(isOrderingOpen(noonUtc, ORDERING_TIME_ZONE)).toBe(true);
    expect(isOrderingOpen(noonUtc, "Pacific/Honolulu")).toBe(false);
  });
});

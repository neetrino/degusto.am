import { describe, expect, it } from "vitest";

import {
  guestContactFromAvailable,
  normalizePhoneDigits,
  phoneMatchKey,
} from "./guest-contact";

describe("normalizePhoneDigits", () => {
  it("normalizes AM local and international forms", () => {
    expect(normalizePhoneDigits("+374 94 601039")).toBe("37494601039");
    expect(normalizePhoneDigits("094601039")).toBe("37494601039");
    expect(normalizePhoneDigits("94601039")).toBe("37494601039");
    expect(normalizePhoneDigits("")).toBe("");
  });
});

describe("phoneMatchKey", () => {
  it("uses last 8 digits", () => {
    expect(phoneMatchKey("+37494601039")).toBe("94601039");
    expect(phoneMatchKey("094601039")).toBe("94601039");
  });
});

describe("guestContactFromAvailable", () => {
  it("never labels contact as Guest when phone exists", () => {
    expect(
      guestContactFromAvailable({ oldId: 42, phone: "37494601039" }),
    ).toEqual({
      contactEmail: "guest-42@guest.import.local",
      contactName: "37494601039",
      firstName: "37494601039",
      lastName: "-",
    });
  });

  it("uses matched user name and email when available", () => {
    expect(
      guestContactFromAvailable({
        oldId: 42,
        phone: "37494601039",
        matched: {
          firstName: "Ani",
          lastName: "Sargsyan",
          email: "Ani@Example.com",
        },
      }),
    ).toEqual({
      contactEmail: "ani@example.com",
      contactName: "Ani Sargsyan",
      firstName: "Ani",
      lastName: "Sargsyan",
    });
  });

  it("falls back to order id label when phone is missing", () => {
    expect(guestContactFromAvailable({ oldId: 99, phone: null })).toEqual({
      contactEmail: "guest-99@guest.import.local",
      contactName: "Order 99",
      firstName: "Order 99",
      lastName: "-",
    });
  });
});

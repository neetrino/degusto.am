import { describe, expect, it } from "vitest";

import {
  isMixedLocaleDescription,
  pickLocalizedProductDescription,
  productDescriptionPlainText,
  splitLocalizedProductDescriptions,
} from "@/features/products/domain/localized-description";

const MIXED_HY_RU_EN =
  "<p>\u054F\u0561\u057E\u0561\u0580\u056B \u0574\u056B\u057D</p><p>\u041C\u044F\u0441\u043E \u0433\u043E\u0432\u044F\u0434\u0438\u043D\u0430</p><p>Beef meat, Tomato</p>";

const MIXED_HY_EN_RU =
  "<p>\u0540\u0561\u057E\u056B \u0574\u056B\u057D</p><p>Chicken</p><p>\u041A\u0443\u0440\u0438\u0446\u0430</p>";

const MIXED_POTATO =
  "<p>\u053F\u0561\u0580\u057F\u0578\u0586\u056B\u056C, \u0541\u0565\u0569, \u0540\u0561\u0574\u0565\u0574\u0578\u0582\u0576\u0584</p><p>\u041A\u0430\u0440\u0442\u043E\u0444\u0435\u043B\u044C, \u041C\u0430\u0441\u043B\u043E, \u0421\u043F\u0435\u0446\u0438\u044F</p><p>Potatoes, Oil, Spice</p>";

describe("pickLocalizedProductDescription", () => {
  it("returns the paragraph for the active locale", () => {
    expect(pickLocalizedProductDescription(MIXED_HY_RU_EN, "hy")).toBe(
      "<p>\u054F\u0561\u057E\u0561\u0580\u056B \u0574\u056B\u057D</p>",
    );
    expect(pickLocalizedProductDescription(MIXED_HY_RU_EN, "ru")).toBe(
      "<p>\u041C\u044F\u0441\u043E \u0433\u043E\u0432\u044F\u0434\u0438\u043D\u0430</p>",
    );
    expect(pickLocalizedProductDescription(MIXED_HY_RU_EN, "en")).toBe(
      "<p>Beef meat, Tomato</p>",
    );
  });

  it("finds English and Russian even when paragraph order changes", () => {
    expect(pickLocalizedProductDescription(MIXED_HY_EN_RU, "en")).toBe(
      "<p>Chicken</p>",
    );
    expect(pickLocalizedProductDescription(MIXED_HY_EN_RU, "ru")).toBe(
      "<p>\u041A\u0443\u0440\u0438\u0446\u0430</p>",
    );
  });

  it("leaves a single-language description unchanged", () => {
    expect(
      pickLocalizedProductDescription("<p>Only one paragraph</p>", "en"),
    ).toBe("<p>Only one paragraph</p>");
    expect(pickLocalizedProductDescription("Plain text", "hy")).toBe(
      "Plain text",
    );
  });
});

describe("productDescriptionPlainText", () => {
  it("strips tags from the localized paragraph", () => {
    expect(productDescriptionPlainText(MIXED_HY_RU_EN, "en")).toBe(
      "Beef meat, Tomato",
    );
    expect(productDescriptionPlainText(MIXED_HY_RU_EN, "hy")).toBe(
      "\u054F\u0561\u057E\u0561\u0580\u056B \u0574\u056B\u057D",
    );
  });
});

describe("splitLocalizedProductDescriptions", () => {
  it("detects mixed multi-locale HTML", () => {
    expect(isMixedLocaleDescription(MIXED_POTATO)).toBe(true);
    expect(isMixedLocaleDescription("<p>Only Armenian</p>")).toBe(false);
  });

  it("splits potato-style blobs into plain text per locale", () => {
    expect(splitLocalizedProductDescriptions(MIXED_POTATO)).toEqual({
      hy: "\u053F\u0561\u0580\u057F\u0578\u0586\u056B\u056C, \u0541\u0565\u0569, \u0540\u0561\u0574\u0565\u0574\u0578\u0582\u0576\u0584",
      ru: "\u041A\u0430\u0440\u0442\u043E\u0444\u0435\u043B\u044C, \u041C\u0430\u0441\u043B\u043E, \u0421\u043F\u0435\u0446\u0438\u044F",
      en: "Potatoes, Oil, Spice",
    });
  });

  it("returns null for single-language descriptions", () => {
    expect(splitLocalizedProductDescriptions("<p>Only one</p>")).toBeNull();
  });
});

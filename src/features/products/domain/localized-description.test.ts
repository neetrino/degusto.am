import { describe, expect, it } from "vitest";

import {
  pickLocalizedProductDescription,
  productDescriptionPlainText,
} from "@/features/products/domain/localized-description";

const MIXED_HY_RU_EN =
  "<p>\u054F\u0561\u057E\u0561\u0580\u056B \u0574\u056B\u057D</p><p>\u041C\u044F\u0441\u043E \u0433\u043E\u0432\u044F\u0434\u0438\u043D\u0430</p><p>Beef meat, Tomato</p>";

const MIXED_HY_EN_RU =
  "<p>\u0540\u0561\u057E\u056B \u0574\u056B\u057D</p><p>Chicken</p><p>\u041A\u0443\u0440\u0438\u0446\u0430</p>";

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

import { describe, expect, it } from "vitest";

import { splitPhoneLine, toTelHref } from "@/lib/phone/tel";

describe("toTelHref", () => {
  it("converts Armenian landline display numbers to E.164 tel links", () => {
    expect(toTelHref("(060) 38-80-80")).toBe("tel:+37460388080");
    expect(toTelHref("(033)-80-80-80")).toBe("tel:+37433808080");
    expect(toTelHref("(010)-38-80-80")).toBe("tel:+37410388080");
  });
});

describe("splitPhoneLine", () => {
  it("keeps the label and wraps each number as a tel part", () => {
    expect(
      splitPhoneLine(
        "Հեռ. (060) 38-80-80 / (033)-80-80-80 / (010)-38-80-80",
      ),
    ).toEqual([
      { kind: "text", value: "Հեռ. " },
      {
        kind: "tel",
        display: "(060) 38-80-80",
        href: "tel:+37460388080",
      },
      { kind: "text", value: " / " },
      {
        kind: "tel",
        display: "(033)-80-80-80",
        href: "tel:+37433808080",
      },
      { kind: "text", value: " / " },
      {
        kind: "tel",
        display: "(010)-38-80-80",
        href: "tel:+37410388080",
      },
    ]);
  });
});

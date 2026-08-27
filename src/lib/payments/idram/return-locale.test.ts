import { describe, expect, it } from "vitest";

import { resolveIdramReturnLocale } from "@/lib/payments/idram/return-locale";

describe("resolveIdramReturnLocale", () => {
  it("prefers the order locale, then cookie, then Accept-Language, then hy", () => {
    const request = new Request("http://localhost/idram/success", {
      headers: {
        cookie: "NEXT_LOCALE=en",
        "accept-language": "ru",
      },
    });
    expect(resolveIdramReturnLocale(request, "hy")).toBe("hy");
    expect(resolveIdramReturnLocale(request, "nope")).toBe("en");
    expect(
      resolveIdramReturnLocale(
        new Request("http://localhost/idram/success", {
          headers: { "accept-language": "ru-RU,ru;q=0.9" },
        }),
        null,
      ),
    ).toBe("ru");
    expect(
      resolveIdramReturnLocale(
        new Request("http://localhost/idram/success"),
        null,
      ),
    ).toBe("hy");
  });
});

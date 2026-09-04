import { describe, expect, it } from "vitest";

import { createEmailAdapter } from "@/lib/email/create-adapter";
import { DEFAULT_EMAIL_FROM, resolveEmailFrom } from "@/lib/email/is-configured";

describe("createEmailAdapter", () => {
  it("uses the stub when Resend is not configured", () => {
    expect(createEmailAdapter({}).name).toBe("stub-email");
  });

  it("uses Resend when an API key is present", () => {
    expect(
      createEmailAdapter({
        RESEND_API_KEY: "re_test",
        EMAIL_FROM: "Degusto <info@example.com>",
      }).name,
    ).toBe("resend");
  });
});

describe("resolveEmailFrom", () => {
  it("falls back to the default Degusto sender", () => {
    expect(resolveEmailFrom(undefined)).toBe(DEFAULT_EMAIL_FROM);
    expect(resolveEmailFrom("  ")).toBe(DEFAULT_EMAIL_FROM);
    expect(resolveEmailFrom("shop@degusto.am")).toBe(
      "Degusto <shop@degusto.am>",
    );
    expect(resolveEmailFrom("Shop <shop@degusto.am>")).toBe(
      "Shop <shop@degusto.am>",
    );
  });
});

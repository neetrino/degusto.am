import { describe, expect, it } from "vitest";

import { buildResetPasswordEmail } from "@/features/auth/reset-password-email";

const RESET_URL =
  "https://degusto.am/hy/reset-password?token=abc_token";

describe("buildResetPasswordEmail", () => {
  it("uses Armenian copy when locale is hy", () => {
    const email = buildResetPasswordEmail("hy", RESET_URL);

    expect(email.subject).toContain("Degusto");
    expect(email.subject).not.toMatch(/Reset your/i);
    expect(email.text).toContain("գաղտնաբառ");
    expect(email.text).toContain(RESET_URL);
    expect(email.html).toContain(`href="${RESET_URL}"`);
    expect(email.html).toContain("գաղտնաբառ");
  });

  it("uses Russian copy when locale is ru", () => {
    const email = buildResetPasswordEmail("ru", RESET_URL);

    expect(email.subject).toMatch(/парол/i);
    expect(email.text).toContain("парол");
    expect(email.text).toContain(RESET_URL);
    expect(email.html).toContain("парол");
  });

  it("keeps English copy for en", () => {
    const email = buildResetPasswordEmail("en", RESET_URL);

    expect(email.subject).toBe("Reset your Degusto password");
    expect(email.text).toContain("We received a request");
    expect(email.html).toContain("Choose a new password");
  });
});

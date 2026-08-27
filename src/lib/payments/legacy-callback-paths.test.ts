import { describe, expect, it } from "vitest";

import { isLegacyPaymentPath } from "@/lib/payments/legacy-callback-paths";

describe("legacy payment callback paths", () => {
  it("keeps Idram / Ineco / FastShift paths off the locale redirect", () => {
    expect(isLegacyPaymentPath("/idram")).toBe(true);
    expect(isLegacyPaymentPath("/idram/success")).toBe(true);
    expect(isLegacyPaymentPath("/inecobank/result")).toBe(true);
    expect(isLegacyPaymentPath("/pay-by-fastshift/callback")).toBe(true);
    expect(isLegacyPaymentPath("/hy/idram")).toBe(false);
    expect(isLegacyPaymentPath("/en/checkout")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import {
  REGISTER_ERROR_CODES,
  resolveAuthErrorMessage,
} from "@/features/auth/auth-action-state";
import { getDictionary } from "@/lib/i18n/get-dictionary";

describe("resolveAuthErrorMessage", () => {
  const hyAuth = getDictionary("hy").auth;
  const enAuth = getDictionary("en").auth;

  it("maps register failure to Armenian copy for hy dictionary", () => {
    expect(
      resolveAuthErrorMessage(
        { errorCode: REGISTER_ERROR_CODES.FAILED },
        hyAuth,
      ),
    ).toBe(hyAuth.registerFailed);
    expect(hyAuth.registerFailed).toMatch(/հաշիվ/i);
    expect(hyAuth.registerFailed).not.toMatch(/Unable to create/i);
  });

  it("maps validation and password mismatch codes to Armenian copy", () => {
    expect(
      resolveAuthErrorMessage(
        { errorCode: REGISTER_ERROR_CODES.INVALID },
        hyAuth,
      ),
    ).toBe(hyAuth.registerInvalid);

    expect(
      resolveAuthErrorMessage(
        { errorCode: REGISTER_ERROR_CODES.PASSWORDS_MISMATCH },
        hyAuth,
      ),
    ).toBe(hyAuth.registerPasswordsMismatch);
  });

  it("uses the page dictionary language, not a hardcoded English string", () => {
    expect(
      resolveAuthErrorMessage(
        { errorCode: REGISTER_ERROR_CODES.FAILED },
        enAuth,
      ),
    ).toBe(enAuth.registerFailed);

    expect(
      resolveAuthErrorMessage(
        { errorCode: REGISTER_ERROR_CODES.FAILED },
        hyAuth,
      ),
    ).not.toBe(enAuth.registerFailed);
  });

  it("falls back to legacy localized error strings", () => {
    expect(
      resolveAuthErrorMessage({ error: hyAuth.genericError }, hyAuth),
    ).toBe(hyAuth.genericError);
  });
});

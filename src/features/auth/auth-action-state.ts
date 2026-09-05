import type { Dictionary } from "@/lib/i18n/get-dictionary";

/** Stable codes — never put UI language in server action returns for register. */
export const REGISTER_ERROR_CODES = {
  INVALID: "REGISTER_INVALID",
  PASSWORDS_MISMATCH: "REGISTER_PASSWORDS_MISMATCH",
  FAILED: "REGISTER_FAILED",
} as const;

export type RegisterErrorCode =
  (typeof REGISTER_ERROR_CODES)[keyof typeof REGISTER_ERROR_CODES];

export type AuthActionState = {
  /**
   * Localized fallback for actions that still return copy (e.g. login).
   * Prefer `errorCode` so the client dictionary owns the language.
   */
  error?: string;
  errorCode?: RegisterErrorCode;
};

/**
 * Resolves the alert text from a register error code using the page dictionary.
 * Falls back to `error` for actions that still return localized strings.
 */
export function resolveAuthErrorMessage(
  state: AuthActionState,
  dictionary: Dictionary["auth"],
): string | undefined {
  if (state.errorCode) {
    switch (state.errorCode) {
      case REGISTER_ERROR_CODES.INVALID:
        return dictionary.registerInvalid;
      case REGISTER_ERROR_CODES.PASSWORDS_MISMATCH:
        return dictionary.registerPasswordsMismatch;
      case REGISTER_ERROR_CODES.FAILED:
        return dictionary.registerFailed;
      default: {
        const _exhaustive: never = state.errorCode;
        return _exhaustive;
      }
    }
  }

  return state.error;
}

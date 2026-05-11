/**
 * Map known API `detail` / error text to i18n keys (register page).
 */
export function resolveRegisterApiError(
  raw: string,
  translate: (key: string) => string
): string {
  const m = (raw ?? "").trim();
  if (!m) {
    return translate("register.errors.registrationFailed");
  }
  const low = m.toLowerCase();
  if (
    low.includes("already exists") ||
    low.includes("user already exists") ||
    low.includes("409") ||
    low.includes("p2002")
  ) {
    return translate("register.errors.userExists");
  }
  if (low.includes("at least 6 characters")) {
    return translate("register.errors.passwordMinLength");
  }
  if (low.includes("either email or phone")) {
    return translate("register.errors.emailOrPhoneRequired");
  }
  return m;
}

/**
 * Map known API errors to i18n keys (login page).
 */
export function resolveLoginApiError(
  raw: string,
  translate: (key: string) => string
): string {
  const m = (raw ?? "").trim();
  if (!m) {
    return translate("login.errors.loginFailed");
  }
  const low = m.toLowerCase();
  if (
    low.includes("invalid email") ||
    low.includes("invalid email/phone") ||
    low.includes("invalid credentials") ||
    (low.includes("invalid") && low.includes("password"))
  ) {
    return translate("login.errors.invalidCredentials");
  }
  if (low.includes("blocked")) {
    return translate("login.errors.accountBlocked");
  }
  return m;
}

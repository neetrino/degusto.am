/** Password reset token lifetime. */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Generic response copy — avoids account enumeration. */
export const PASSWORD_RESET_REQUEST_ACK =
  'If an account exists for this email, password reset instructions were sent.';

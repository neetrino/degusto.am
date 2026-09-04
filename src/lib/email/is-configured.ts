/** Default Resend sender when `EMAIL_FROM` is unset. */
export const DEFAULT_EMAIL_FROM = "Degusto <degusto@mail.neetrino.com>";

/** True when a Resend API key is present so the real adapter can send mail. */
export function isResendConfigured(input: {
  apiKey?: string;
}): input is { apiKey: string } {
  return Boolean(input.apiKey);
}

/** From-address for outbound mail; falls back to the Resend test domain. */
export function resolveEmailFrom(from: string | undefined): string {
  const trimmed = from?.trim();
  if (!trimmed) {
    return DEFAULT_EMAIL_FROM;
  }

  if (trimmed.includes("<")) {
    return trimmed;
  }

  return `Degusto <${trimmed}>`;
}

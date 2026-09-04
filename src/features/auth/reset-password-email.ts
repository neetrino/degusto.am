import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export type ResetPasswordEmail = {
  subject: string;
  text: string;
  html: string;
};

/** Localized reset-password mail. `resetUrl` must already be a trusted absolute URL. */
export function buildResetPasswordEmail(
  locale: Locale,
  resetUrl: string,
): ResetPasswordEmail {
  const copy = getDictionary(locale).auth;
  const text = [
    copy.resetEmailIntro,
    "",
    copy.resetEmailOpenLink,
    resetUrl,
    "",
    copy.resetEmailIgnore,
  ].join("\n");

  const html = [
    `<p>${copy.resetEmailIntro}</p>`,
    `<p><a href="${resetUrl}">${copy.resetEmailLinkLabel}</a> (${copy.resetEmailExpiry}).</p>`,
    `<p>${copy.resetEmailIgnore}</p>`,
  ].join("");

  return {
    subject: copy.resetEmailSubject,
    text,
    html,
  };
}

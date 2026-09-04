"use server";

import { eq } from "drizzle-orm";

import { getEnv } from "@/config/env";
import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { users } from "@/db/schema";
import { forgotPasswordSchema } from "@/features/auth/schemas";
import { issuePasswordResetToken } from "@/lib/auth/password-reset-tokens";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { logger } from "@/lib/observability/logger";

export type ForgotPasswordActionState = {
  error?: string;
  sent?: boolean;
};

function buildResetEmail(resetUrl: string) {
  const text = [
    "We received a request to reset your Degusto password.",
    "",
    "Open this link to choose a new password (expires in 1 hour):",
    resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = `
    <p>We received a request to reset your Degusto password.</p>
    <p><a href="${resetUrl}">Choose a new password</a> (link expires in 1 hour).</p>
    <p>If you did not request this, you can ignore this email.</p>
  `.trim();

  return {
    subject: "Reset your Degusto password",
    text,
    html,
  };
}

export async function forgotPasswordAction(
  localeInput: string,
  _previousState: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const locale: Locale = isLocale(localeInput) ? localeInput : defaultLocale;
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: getDictionary(locale).auth.forgotPasswordInvalid };
  }

  try {
    const [user] = await getDb()
      .select({ id: users.id, email: users.email, status: users.status })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (user && user.status === "ACTIVE") {
      const providers = getProviders();
      const rawToken = await issuePasswordResetToken(
        providers.redis.getClient(),
        user.id,
      );
      const resetUrl = new URL(
        `/${locale}/reset-password`,
        getEnv().NEXT_PUBLIC_APP_URL,
      );
      resetUrl.searchParams.set("token", rawToken);

      const resetHref = resetUrl.toString();
      if (getEnv().NODE_ENV !== "production") {
        logger.info("auth.forgot_password_dev_reset_url", {
          resetUrl: resetHref,
        });
      }

      const email = buildResetEmail(resetHref);
      await providers.email.send({
        to: user.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
    }
  } catch (error) {
    logger.error("auth.forgot_password_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return {
      error: getDictionary(locale).auth.forgotPasswordUnavailable,
    };
  }

  return { sent: true };
}

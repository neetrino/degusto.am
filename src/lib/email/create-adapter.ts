import { createResendEmailAdapter } from "@/lib/email/resend-adapter";
import { isResendConfigured, resolveEmailFrom } from "@/lib/email/is-configured";
import { createStubEmailAdapter } from "@/lib/email/stub-adapter";
import type { EmailAdapter } from "@/lib/email/types";
import { logger } from "@/lib/observability/logger";

export type EmailAdapterEnv = {
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
};

/** Resend when `RESEND_API_KEY` is set; otherwise the local stub logger. */
export function createEmailAdapter(env: EmailAdapterEnv): EmailAdapter {
  const credentials = { apiKey: env.RESEND_API_KEY };
  if (!isResendConfigured(credentials)) {
    return createStubEmailAdapter();
  }

  const from = resolveEmailFrom(env.EMAIL_FROM);
  if (!env.EMAIL_FROM) {
    logger.warn("email.from_fallback", { from });
  }

  return createResendEmailAdapter({
    apiKey: credentials.apiKey,
    from,
  });
}

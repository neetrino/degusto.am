import { Resend } from "resend";

import type { EmailAdapter } from "@/lib/email/types";
import { logger } from "@/lib/observability/logger";

export type ResendSendResult = {
  data?: { id: string } | null;
  error?: { message: string } | null;
};

export type ResendSendFn = (payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) => Promise<ResendSendResult>;

export type ResendAdapterConfig = {
  apiKey: string;
  from: string;
  send?: ResendSendFn;
};

/** Resend adapter for verification, password reset, and transactional mail. */
export function createResendEmailAdapter(
  config: ResendAdapterConfig,
): EmailAdapter {
  const send: ResendSendFn =
    config.send ??
    ((payload) => new Resend(config.apiKey).emails.send(payload));

  return {
    name: "resend",
    async send(message) {
      const { data, error } = await send({
        from: config.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      if (error) {
        logger.error("email.resend.send_failed", {
          message: error.message,
        });
        throw new Error(error.message);
      }

      if (!data?.id) {
        throw new Error("Resend did not return an email id.");
      }

      logger.info("email.resend.send", { id: data.id });
      return { id: data.id };
    },
  };
}

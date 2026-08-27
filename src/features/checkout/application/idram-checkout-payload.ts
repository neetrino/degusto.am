import "server-only";

import { getIdramCredentials } from "@/lib/payments/idram/credentials";
import {
  IDRAM_GET_PAYMENT_URL,
  buildIdramFormFields,
  idramFormData,
} from "@/lib/payments/idram/protocol";
import type { Locale } from "@/lib/i18n/config";

export type IdramCheckoutPayload = {
  formAction: string;
  formData: Record<string, string>;
};

export function buildIdramCheckoutPayload(input: {
  locale: Locale;
  orderNumber: string;
  totalAmount: number;
  contactEmail: string | null;
}): IdramCheckoutPayload | null {
  const credentials = getIdramCredentials();
  if (!credentials) {
    return null;
  }
  return {
    formAction: IDRAM_GET_PAYMENT_URL,
    formData: idramFormData(
      buildIdramFormFields({
        recAccount: credentials.recAccount,
        locale: input.locale,
        orderNumber: input.orderNumber,
        totalAmount: input.totalAmount,
        contactEmail: input.contactEmail,
      }),
    ),
  };
}

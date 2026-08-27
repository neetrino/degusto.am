import { createHash } from "node:crypto";

import { safeEqualString } from "@/lib/payments/webhook-guards";
import type { Locale } from "@/lib/i18n/config";

/** Idram GetPayment endpoint — same URL for test and live accounts. */
export const IDRAM_GET_PAYMENT_URL =
  "https://banking.idram.am/Payment/GetPayment";

export const IDRAM_OK = "OK";

export const IDRAM_FAIL = {
  NO_BILL: "FAIL_NO_BILL",
  ORDER: "FAIL_ORDER",
  ACCOUNT: "FAIL_ACCOUNT",
  AMOUNT: "FAIL_AMOUNT",
  CHECKSUM: "FAIL_CHECKSUM",
  STATUS: "FAIL_STATUS",
  GENERIC: "FAIL",
} as const;

export type IdramFailToken = (typeof IDRAM_FAIL)[keyof typeof IDRAM_FAIL];

const IDRAM_LANGUAGE: Record<Locale, "AM" | "EN" | "RU"> = {
  hy: "AM",
  en: "EN",
  ru: "RU",
};

/** Formats integer AMD as an Idram decimal string with a dot. */
export function formatIdramAmount(integerAmd: number): string {
  return integerAmd.toFixed(2);
}

/** True when the callback amount matches the DB integer AMD total. */
export function idramAmountsMatch(
  dbIntegerAmd: number,
  edpAmount: string,
): boolean {
  const parsed = Number.parseFloat(edpAmount.trim());
  if (!Number.isFinite(parsed)) {
    return false;
  }
  return formatIdramAmount(dbIntegerAmd) === formatIdramAmount(parsed);
}

/** Maps storefront locale to Idram EDP_LANGUAGE. */
export function idramLanguage(locale: Locale): "AM" | "EN" | "RU" {
  return IDRAM_LANGUAGE[locale];
}

export type IdramChecksumInput = {
  recAccount: string;
  amount: string;
  secretKey: string;
  billNo: string;
  payerAccount: string;
  transId: string;
  transDate: string;
};

/** MD5 hex of EDP_REC_ACCOUNT:EDP_AMOUNT:SECRET:BILL:PAYER:TRANS_ID:TRANS_DATE. */
export function computeIdramChecksum(input: IdramChecksumInput): string {
  const payload = [
    input.recAccount,
    input.amount,
    input.secretKey,
    input.billNo,
    input.payerAccount,
    input.transId,
    input.transDate,
  ].join(":");
  return createHash("md5").update(payload, "utf8").digest("hex");
}

/** Case-insensitive checksum compare; does not log or return the secret. */
export function idramChecksumMatches(
  input: IdramChecksumInput,
  received: string,
): boolean {
  const expected = computeIdramChecksum(input).toUpperCase();
  const actual = received.trim().toUpperCase();
  return safeEqualString(expected, actual);
}

export type IdramFormFields = {
  EDP_LANGUAGE: string;
  EDP_REC_ACCOUNT: string;
  EDP_DESCRIPTION: string;
  EDP_AMOUNT: string;
  EDP_BILL_NO: string;
  order_number: string;
  EDP_EMAIL?: string;
};

export type BuildIdramFormInput = {
  recAccount: string;
  locale: Locale;
  orderNumber: string;
  totalAmount: number;
  contactEmail?: string | null;
};

/** Hidden-field payload for auto-POST to Idram GetPayment. */
export function buildIdramFormFields(input: BuildIdramFormInput): IdramFormFields {
  const fields: IdramFormFields = {
    EDP_LANGUAGE: idramLanguage(input.locale),
    EDP_REC_ACCOUNT: input.recAccount,
    EDP_DESCRIPTION: `Order ${input.orderNumber}`,
    EDP_AMOUNT: formatIdramAmount(input.totalAmount),
    EDP_BILL_NO: input.orderNumber,
    order_number: input.orderNumber,
  };
  const email = input.contactEmail?.trim();
  if (email) {
    fields.EDP_EMAIL = email;
  }
  return fields;
}

/** Drops undefined optional fields for the HTML form. */
export function idramFormData(
  fields: IdramFormFields,
): Record<string, string> {
  const data: Record<string, string> = {
    EDP_LANGUAGE: fields.EDP_LANGUAGE,
    EDP_REC_ACCOUNT: fields.EDP_REC_ACCOUNT,
    EDP_DESCRIPTION: fields.EDP_DESCRIPTION,
    EDP_AMOUNT: fields.EDP_AMOUNT,
    EDP_BILL_NO: fields.EDP_BILL_NO,
    order_number: fields.order_number,
  };
  if (fields.EDP_EMAIL) {
    data.EDP_EMAIL = fields.EDP_EMAIL;
  }
  return data;
}

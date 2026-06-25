import { IDRAM_FORM_ACTION } from "./constants";
import type { IdramFormData } from "./types";

const LOCALE_TO_IDRAM_LANG: Record<string, string> = {
  hy: "AM",
  ru: "RU",
  en: "EN",
};

function resolveIdramLanguage(locale: string | undefined, lang?: string): string {
  if (lang && LOCALE_TO_IDRAM_LANG[lang]) {
    return LOCALE_TO_IDRAM_LANG[lang];
  }
  if (locale && LOCALE_TO_IDRAM_LANG[locale]) {
    return LOCALE_TO_IDRAM_LANG[locale];
  }
  return "EN";
}

/** Build Idram GetPayment form fields. */
export function buildIdramFormData(params: {
  orderNumber: string;
  amount: number;
  description: string;
  recAccount: string;
  email?: string | null;
  locale?: string;
  lang?: string;
}): IdramFormData {
  const formData: IdramFormData = {
    EDP_LANGUAGE: resolveIdramLanguage(params.locale, params.lang),
    EDP_REC_ACCOUNT: params.recAccount,
    EDP_DESCRIPTION: params.description,
    EDP_AMOUNT: params.amount.toFixed(2).replace(/\.?0+$/, "") || "0",
    EDP_BILL_NO: params.orderNumber,
  };

  if (params.email?.trim()) {
    formData.EDP_EMAIL = params.email.trim();
  }

  return formData;
}

export function getIdramFormAction(): string {
  return IDRAM_FORM_ACTION;
}

export type IdramInitPayload = {
  formAction: string;
  formData: IdramFormData;
};

export function createIdramInitPayload(params: {
  orderNumber: string;
  amount: number;
  description: string;
  recAccount: string;
  email?: string | null;
  locale?: string;
  lang?: string;
}): IdramInitPayload {
  return {
    formAction: getIdramFormAction(),
    formData: buildIdramFormData(params),
  };
}

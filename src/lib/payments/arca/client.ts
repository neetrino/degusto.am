import type { Locale } from "@/lib/i18n/config";
import type { ArcaCredentials } from "@/lib/payments/arca/credentials-select";
import {
  ARCA_CURRENCY_AMD,
  ARCA_FORCE_3DS2,
  amdToMinorUnits,
  arcaLanguage,
  arcaReturnUrl,
  buildArcaFormUrl,
  isHttpsUrl,
  parseArcaRegisterResponse,
  parseArcaStatusResponse,
  readArcaOrderIdFromStatusPayload,
  type ArcaRegisterResult,
  type ArcaStatusSnapshot,
} from "@/lib/payments/arca/protocol";
import { logger } from "@/lib/observability/logger";

export type ArcaFetch = (
  input: string,
  init: RequestInit,
) => Promise<Response>;

export type ArcaRegisterInput = {
  orderNumber: string;
  totalAmount: number;
  locale: Locale;
  appUrl: string;
  description?: string;
};

export type ArcaRecoveredRegistration = {
  orderId: string;
  formUrl: string;
};

const FETCH_MS = 20_000;

async function postArcaForm(
  credentials: ArcaCredentials,
  endpoint: "register.do" | "getOrderStatusExtended.do",
  fields: Record<string, string>,
  fetchImpl: ArcaFetch,
): Promise<unknown> {
  const url = `${credentials.baseUrl}/${endpoint}`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
    signal: AbortSignal.timeout(FETCH_MS),
  });
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    logger.warn("Arca response was not JSON", {
      endpoint,
      httpStatus: response.status,
    });
    return null;
  }
}

function authFields(credentials: ArcaCredentials): Record<string, string> {
  return { userName: credentials.userName, password: credentials.password };
}

/** register.do — does not log the password. */
export async function registerArcaOrder(
  credentials: ArcaCredentials,
  input: ArcaRegisterInput,
  fetchImpl: ArcaFetch = fetch,
): Promise<ArcaRegisterResult> {
  try {
    const payload = await postArcaForm(
      credentials,
      "register.do",
      {
        ...authFields(credentials),
        orderNumber: input.orderNumber,
        amount: String(amdToMinorUnits(input.totalAmount)),
        currency: ARCA_CURRENCY_AMD,
        returnUrl: arcaReturnUrl(input.appUrl, input.orderNumber),
        description: input.description ?? `Order ${input.orderNumber}`,
        language: arcaLanguage(input.locale),
        jsonParams: ARCA_FORCE_3DS2,
      },
      fetchImpl,
    );
    const result = parseArcaRegisterResponse(payload);
    if (!result.ok) {
      logger.warn("Arca register.do failed", {
        orderNumber: input.orderNumber,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      });
    }
    return result;
  } catch {
    logger.error("Arca register.do request failed", {
      orderNumber: input.orderNumber,
    });
    return { ok: false, errorCode: -1 };
  }
}

/** getOrderStatusExtended.do — never trust returnUrl query as paid. */
export async function getArcaOrderStatus(
  credentials: ArcaCredentials,
  arcaOrderId: string,
  fetchImpl: ArcaFetch = fetch,
): Promise<ArcaStatusSnapshot | null> {
  try {
    const payload = await postArcaForm(
      credentials,
      "getOrderStatusExtended.do",
      { ...authFields(credentials), orderId: arcaOrderId },
      fetchImpl,
    );
    return parseArcaStatusResponse(payload);
  } catch {
    logger.error("Arca getOrderStatusExtended.do request failed", {});
    return null;
  }
}

/** Rebuild formUrl when Arca already has the order but we lost the redirect URL. */
export async function recoverArcaCheckoutRegistration(
  credentials: ArcaCredentials,
  input: { orderNumber: string; locale: Locale },
  fetchImpl: ArcaFetch = fetch,
): Promise<ArcaRecoveredRegistration | null> {
  try {
    const payload = await postArcaForm(
      credentials,
      "getOrderStatusExtended.do",
      { ...authFields(credentials), orderNumber: input.orderNumber },
      fetchImpl,
    );
    const orderId = readArcaOrderIdFromStatusPayload(payload);
    if (!orderId) {
      return null;
    }
    const formUrl = buildArcaFormUrl(
      credentials.baseUrl,
      credentials.userName,
      input.locale,
      orderId,
    );
    if (!formUrl || !isHttpsUrl(formUrl)) {
      return null;
    }
    return { orderId, formUrl };
  } catch {
    logger.error("Arca checkout recovery failed", {
      orderNumber: input.orderNumber,
    });
    return null;
  }
}

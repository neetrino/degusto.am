import { logger } from "@/lib/utils/logger";
import { problemTypes } from "@/lib/http/problem-details";
import { getArcaConfig } from "./config";
import { ARCA_FORCE_3DS2_JSON } from "./constants";
import type {
  ArcaOrderStatusResponse,
  ArcaRegisterParams,
  ArcaRegisterResponse,
  ArcaRegisterResult,
  ArcaStatusResult,
} from "./types";
import { ARCA_ORDER_STATUS, ARCA_PAYMENT_STATE } from "./constants";

function parseErrorCode(value: string | number | undefined): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : -1;
  }
  return -1;
}

function throwArcaApiError(params: {
  endpoint: string;
  errorCode: string | number | undefined;
  errorMessage: string | undefined;
  fallback: string;
  requestContext?: Record<string, unknown>;
}): never {
  const code = parseErrorCode(params.errorCode);
  const message = params.errorMessage?.trim() || params.fallback;

  logger.error(`Arca ${params.endpoint} failed`, {
    errorCode: params.errorCode,
    errorMessage: message,
    ...params.requestContext,
  });

  const isRegisterParamError = params.endpoint === "register.do" && code === 5;
  throw {
    status: isRegisterParamError ? 503 : 502,
    type: isRegisterParamError ? problemTypes.configError : problemTypes.serviceUnavailable,
    title: isRegisterParamError ? "Payment gateway not configured" : "Payment gateway error",
    detail: isRegisterParamError
      ? "Arca rejected register.do (error 5). Check ARCA_API_USERNAME, ARCA_API_PASSWORD, ARCA_API_BASE_URL, amount, orderNumber, and returnUrl. Re-run the same call in Postman against your ARCA_API_BASE_URL."
      : message,
  };
}

async function postForm<T>(
  endpoint: string,
  fields: Record<string, string>,
  requestContext?: Record<string, unknown>
): Promise<T> {
  const config = getArcaConfig();
  const body = new URLSearchParams({
    userName: config.username,
    password: config.password,
    ...fields,
  });
  const url = `${config.apiBaseUrl}/${endpoint}`;

  logger.debug("Arca API request", {
    endpoint,
    apiBaseUrl: config.apiBaseUrl,
    username: config.username,
    bank: config.bank,
    isTestMode: config.isTestMode,
    ...requestContext,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    logger.error("Arca API HTTP error", { endpoint, status: response.status, apiBaseUrl: config.apiBaseUrl });
    throw new Error(`Arca API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

function buildRegisterFields(params: ArcaRegisterParams): Record<string, string> {
  const fields: Record<string, string> = {
    orderNumber: params.orderNumber,
    amount: String(params.amountMinorUnits),
    currency: params.currencyCode,
    returnUrl: params.returnUrl,
    description: params.description,
    language: params.language,
  };

  if (process.env.ARCA_FORCE_3DS2 === "true") {
    fields.jsonParams = ARCA_FORCE_3DS2_JSON;
  }

  return fields;
}

/** Register order in Arca and return payment form URL. */
export async function registerArcaOrder(params: ArcaRegisterParams): Promise<ArcaRegisterResult> {
  const registerFields = buildRegisterFields(params);
  const requestContext = {
    orderNumber: params.orderNumber,
    amount: registerFields.amount,
    currency: params.currencyCode,
    returnUrl: params.returnUrl,
  };
  const payload = await postForm<ArcaRegisterResponse>("register.do", registerFields, requestContext);

  if (parseErrorCode(payload.errorCode) !== 0 || !payload.orderId || !payload.formUrl) {
    throwArcaApiError({
      endpoint: "register.do",
      errorCode: payload.errorCode,
      errorMessage: payload.errorMessage,
      fallback: "Arca register.do failed",
      requestContext,
    });
  }

  return {
    arcaOrderId: payload.orderId,
    formUrl: payload.formUrl,
  };
}

/** Verify payment status via getOrderStatusExtended.do (never trust redirect params). */
export async function getArcaOrderStatus(arcaOrderId: string): Promise<ArcaStatusResult> {
  const payload = await postForm<ArcaOrderStatusResponse>("getOrderStatusExtended.do", {
    orderId: arcaOrderId,
  });

  if (parseErrorCode(payload.errorCode) !== 0) {
    throwArcaApiError({
      endpoint: "getOrderStatusExtended.do",
      errorCode: payload.errorCode,
      errorMessage: payload.errorMessage,
      fallback: "Arca status check failed",
    });
  }

  const paymentState = payload.paymentAmountInfo?.paymentState;
  const isPaid =
    paymentState === ARCA_PAYMENT_STATE.deposited ||
    payload.orderStatus === ARCA_ORDER_STATUS.deposited;

  return { isPaid, response: payload };
}

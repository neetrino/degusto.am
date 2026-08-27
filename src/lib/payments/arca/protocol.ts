import type { Locale } from "@/lib/i18n/config";

export const ARCA_CURRENCY_AMD = "051";
export const ARCA_FORCE_3DS2 = '{"FORCE_3DS2":"true"}';
export const ARCA_REGISTER_ALREADY = 1;

export type ArcaRegisterResult =
  | { ok: true; orderId: string; formUrl: string }
  | { ok: false; errorCode: number; errorMessage?: string };

export type ArcaStatusSnapshot = {
  errorCode: number;
  orderNumber?: string;
  orderStatus?: number;
  paymentState?: string;
  depositedAmount?: number;
  approvedAmount?: number;
};

/** Integer AMD → Arca minor units (1900 AMD → 190000). */
export function amdToMinorUnits(integerAmd: number): number {
  if (!Number.isInteger(integerAmd) || integerAmd < 0) {
    throw new Error("Invalid AMD amount.");
  }
  return integerAmd * 100;
}

export function arcaLanguage(locale: Locale): Locale {
  return locale;
}

export function arcaReturnUrl(appUrl: string, orderNumber: string): string {
  const origin = appUrl.replace(/\/$/, "");
  return `${origin}/inecobank/result?order=${encodeURIComponent(orderNumber)}`;
}

export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function readArcaString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

export function readArcaNumber(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function parseArcaRegisterResponse(
  payload: unknown,
): ArcaRegisterResult {
  const record = asRecord(payload);
  if (!record) {
    return { ok: false, errorCode: -1, errorMessage: "Invalid register response." };
  }
  const errorCode = readArcaNumber(record, "errorCode") ?? -1;
  const orderId = readArcaString(record, "orderId");
  const formUrl = readArcaString(record, "formUrl");
  if (errorCode === 0 && orderId && formUrl && isHttpsUrl(formUrl)) {
    return { ok: true, orderId, formUrl };
  }
  return {
    ok: false,
    errorCode,
    errorMessage: readArcaString(record, "errorMessage"),
  };
}

function readAmountInfo(
  record: Record<string, unknown>,
): Record<string, unknown> | null {
  return asRecord(record.paymentAmountInfo);
}

export function parseArcaStatusResponse(
  payload: unknown,
): ArcaStatusSnapshot | null {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }
  const info = readAmountInfo(record);
  return {
    errorCode: readArcaNumber(record, "errorCode") ?? -1,
    orderNumber: readArcaString(record, "orderNumber"),
    orderStatus: readArcaNumber(record, "orderStatus"),
    paymentState: info
      ? readArcaString(info, "paymentState")
      : readArcaString(record, "paymentState"),
    depositedAmount: info
      ? readArcaNumber(info, "depositedAmount")
      : readArcaNumber(record, "depositedAmount"),
    approvedAmount: info
      ? readArcaNumber(info, "approvedAmount")
      : undefined,
  };
}

function paymentStateUpper(status: ArcaStatusSnapshot): string | undefined {
  return status.paymentState?.trim().toUpperCase();
}

/**
 * Paid only when DEPOSITED / orderStatus 2, depositedAmount > 0, and
 * amount matches. orderStatus 5 (REFUNDED) is never success.
 */
export function isArcaDepositSuccess(
  status: ArcaStatusSnapshot,
  expectedMinorUnits: number,
): boolean {
  if (status.errorCode !== 0) {
    return false;
  }
  const state = paymentStateUpper(status);
  if (status.orderStatus === 5 || state === "REFUNDED") {
    return false;
  }
  const deposited = status.depositedAmount;
  if (typeof deposited !== "number" || deposited <= 0) {
    return false;
  }
  if (deposited !== expectedMinorUnits) {
    return false;
  }
  return state === "DEPOSITED" || status.orderStatus === 2;
}

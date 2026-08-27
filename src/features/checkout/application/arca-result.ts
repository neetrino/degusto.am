import { NextResponse } from "next/server";

import {
  captureArcaOrder,
  failPendingArcaOrder,
  loadArcaPaymentByBankOrderId,
  loadArcaPaymentByOrderNumber,
  type ArcaPaymentSnapshot,
} from "@/features/checkout/application/arca-order";
import type { Locale } from "@/lib/i18n/config";
import { getArcaOrderStatus } from "@/lib/payments/arca/client";
import { getArcaCredentials } from "@/lib/payments/arca/credentials";
import {
  amdToMinorUnits,
  isArcaDepositSuccess,
} from "@/lib/payments/arca/protocol";
import { resolveIdramReturnLocale } from "@/lib/payments/idram/return-locale";
import { logger } from "@/lib/observability/logger";

function redirectTo(
  request: Request,
  locale: Locale,
  path: string,
): NextResponse {
  return NextResponse.redirect(new URL(`/${locale}${path}`, request.url));
}

function failedRedirect(
  request: Request,
  locale: Locale,
): NextResponse {
  return redirectTo(request, locale, "/checkout?payment=failed");
}

function firstQueryValue(
  params: URLSearchParams,
  keys: readonly string[],
): string | undefined {
  for (const key of keys) {
    const value = params.get(key)?.trim();
    if (value) {
      return value;
    }
  }
  return undefined;
}

async function readReturnParams(
  request: Request,
): Promise<{ orderNumber?: string; bankOrderId?: string }> {
  const params = new URL(request.url).searchParams;
  if (request.method === "POST") {
    try {
      const form = await request.formData();
      form.forEach((value, key) => {
        if (typeof value === "string" && value.trim() && !params.has(key)) {
          params.set(key, value.trim());
        }
      });
    } catch {
      // Bank may GET-only; query params still apply.
    }
  }
  return {
    orderNumber: firstQueryValue(params, ["order", "orderNumber"]),
    bankOrderId: firstQueryValue(params, ["orderId"]),
  };
}

async function resolveArcaPayment(input: {
  orderNumber?: string;
  bankOrderId?: string;
}): Promise<ArcaPaymentSnapshot | null> {
  if (input.orderNumber) {
    const byNumber = await loadArcaPaymentByOrderNumber(input.orderNumber);
    if (
      byNumber &&
      input.bankOrderId &&
      byNumber.providerReference &&
      byNumber.providerReference !== input.bankOrderId
    ) {
      logger.warn("Arca return orderId mismatch", {
        orderNumber: input.orderNumber,
      });
      return null;
    }
    if (byNumber) {
      return byNumber;
    }
  }
  if (input.bankOrderId) {
    return loadArcaPaymentByBankOrderId(input.bankOrderId);
  }
  return null;
}

async function captureAndRedirect(
  request: Request,
  locale: Locale,
  orderNumber: string,
): Promise<NextResponse> {
  try {
    const capture = await captureArcaOrder(orderNumber);
    if (capture === "missing") {
      return failedRedirect(request, locale);
    }
    return redirectTo(request, locale, `/checkout/success/${orderNumber}`);
  } catch {
    logger.error("Arca capture failed", { orderNumber });
    return failedRedirect(request, locale);
  }
}

/**
 * Browser return from Ineco. Never treats query orderId/order as paid;
 * always calls getOrderStatusExtended.do.
 */
export async function handleArcaResult(
  request: Request,
): Promise<NextResponse> {
  const params = await readReturnParams(request);
  const payment = await resolveArcaPayment(params);
  const locale = resolveIdramReturnLocale(request, payment?.locale);
  if (!payment) {
    return failedRedirect(request, locale);
  }
  if (payment.paymentStatus === "CAPTURED") {
    return redirectTo(
      request,
      locale,
      `/checkout/success/${payment.orderNumber}`,
    );
  }
  if (!payment.providerReference) {
    logger.warn("Arca return missing providerReference", {
      orderNumber: payment.orderNumber,
    });
    return failedRedirect(request, locale);
  }
  return settleArcaReturn(request, locale, payment);
}

async function settleArcaReturn(
  request: Request,
  locale: Locale,
  payment: ArcaPaymentSnapshot,
): Promise<NextResponse> {
  const credentials = getArcaCredentials();
  if (!credentials || !payment.providerReference) {
    return failedRedirect(request, locale);
  }
  const status = await getArcaOrderStatus(
    credentials,
    payment.providerReference,
  );
  if (!status) {
    logger.warn("Arca status lookup failed", {
      orderNumber: payment.orderNumber,
    });
    return failedRedirect(request, locale);
  }
  const expected = amdToMinorUnits(payment.totalAmount);
  if (isArcaDepositSuccess(status, expected)) {
    return captureAndRedirect(request, locale, payment.orderNumber);
  }
  if (payment.paymentStatus === "PENDING") {
    await failPendingArcaOrder(payment.orderNumber);
  }
  return failedRedirect(request, locale);
}

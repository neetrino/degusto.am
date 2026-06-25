import { db } from "@white-shop/db";
import { buildAppUrl } from "@/lib/payments/app-url";
import { ISO4217_NUMERIC, toArcaMinorUnits } from "@/lib/payments/constants";
import { loadPendingPaymentOrder } from "@/lib/payments/load-pending-order";
import {
  markOrderPaymentFailed,
  markOrderPaymentPaid,
} from "@/lib/payments/mark-order-payment";
import {
  redirectToCheckoutError,
  redirectToCheckoutSuccess,
} from "@/lib/payments/payment-route-utils";
import { logger } from "@/lib/utils/logger";
import { getArcaOrderStatus, registerArcaOrder } from "./client";
import type { NextResponse } from "next/server";

const LOCALE_TO_ARCA_LANG: Record<string, string> = {
  hy: "hy",
  ru: "ru",
  en: "en",
};

type StoredArcaProviderResponse = {
  formUrl?: string;
};

function readStoredFormUrl(providerResponse: unknown): string | null {
  if (!providerResponse || typeof providerResponse !== "object") {
    return null;
  }
  const formUrl = (providerResponse as StoredArcaProviderResponse).formUrl;
  return typeof formUrl === "string" && formUrl.trim() ? formUrl.trim() : null;
}

function buildArcaRegisterOrderNumber(orderNumber: string): string {
  return `${orderNumber.replace(/\D/g, "")}${Date.now()}`;
}

function resolveArcaLanguage(locale: string | undefined, lang?: string): string {
  if (lang && LOCALE_TO_ARCA_LANG[lang]) {
    return LOCALE_TO_ARCA_LANG[lang];
  }
  if (locale && LOCALE_TO_ARCA_LANG[locale]) {
    return LOCALE_TO_ARCA_LANG[locale];
  }
  return "en";
}

export type ArcaInitInput = {
  orderNumber: string;
  lang?: string;
};

export type ArcaInitResult = {
  redirectUrl: string;
};

/** Initiate Arca payment: register order and return bank form URL. */
export async function initiateArcaPayment(input: ArcaInitInput): Promise<ArcaInitResult> {
  const order = await loadPendingPaymentOrder(input.orderNumber, "arca");
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.paymentStatus !== "pending" || order.payment.status !== "pending") {
    throw new Error("Order is not pending payment");
  }

  const cachedFormUrl = readStoredFormUrl(order.payment.providerResponse);
  if (cachedFormUrl && order.payment.providerTransactionId) {
    return { redirectUrl: cachedFormUrl };
  }

  const currencyCode = ISO4217_NUMERIC[order.currency];
  if (!currencyCode) {
    throw new Error(`Unsupported currency for Arca: ${order.currency}`);
  }

  const returnUrl = buildAppUrl(
    `/api/v1/payments/arca/callback?order=${encodeURIComponent(order.number)}`
  );

  const registered = await registerArcaOrder({
    orderNumber: buildArcaRegisterOrderNumber(order.number),
    amountMinorUnits: toArcaMinorUnits(order.total, order.currency),
    currencyCode,
    returnUrl,
    description: `Order ${order.number}`,
    language: resolveArcaLanguage(order.customerLocale, input.lang),
  });

  await db.payment.update({
    where: { id: order.payment.id },
    data: {
      providerTransactionId: registered.arcaOrderId,
      providerResponse: { formUrl: registered.formUrl },
    },
  });

  return { redirectUrl: registered.formUrl };
}

export type ArcaCallbackInput = {
  orderNumber: string;
  arcaOrderId?: string | null;
};

/** Handle Arca browser redirect callback. */
export async function handleArcaCallback(input: ArcaCallbackInput): Promise<NextResponse> {
  const order = await loadPendingPaymentOrder(input.orderNumber, "arca");
  if (!order) {
    logger.warn("Arca callback: order not found", { orderNumber: input.orderNumber });
    return redirectToCheckoutError(input.orderNumber);
  }

  if (order.paymentStatus === "paid") {
    return redirectToCheckoutSuccess(order.number);
  }

  const arcaOrderId =
    input.arcaOrderId?.trim() ||
    order.payment.providerTransactionId?.trim() ||
    "";

  if (!arcaOrderId) {
    await markOrderPaymentFailed({
      orderId: order.id,
      paymentId: order.payment.id,
      errorMessage: "Missing Arca orderId",
    });
    return redirectToCheckoutError(order.number);
  }

  try {
    const status = await getArcaOrderStatus(arcaOrderId);

    if (status.isPaid) {
      await markOrderPaymentPaid({
        orderId: order.id,
        paymentId: order.payment.id,
        providerTransactionId: arcaOrderId,
        providerResponse: status.response as object,
      });
      return redirectToCheckoutSuccess(order.number);
    }

    await markOrderPaymentFailed({
      orderId: order.id,
      paymentId: order.payment.id,
      errorCode: String(status.response.orderStatus ?? ""),
      errorMessage: status.response.paymentAmountInfo?.paymentState ?? "not_deposited",
      providerResponse: status.response as object,
    });
    return redirectToCheckoutError(order.number);
  } catch (error) {
    logger.error("Arca callback status check failed", { error, orderNumber: order.number });
    return redirectToCheckoutError(order.number);
  }
}

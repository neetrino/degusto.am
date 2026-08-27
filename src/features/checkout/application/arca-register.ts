import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders, payments } from "@/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { getArcaCredentials } from "@/lib/payments/arca/credentials";
import {
  recoverArcaCheckoutRegistration,
  registerArcaOrder,
} from "@/lib/payments/arca/client";
import { resolveCheckoutAppUrl } from "@/lib/app-url/resolve-checkout-app-url";
import {
  ARCA_REGISTER_ALREADY,
  arcaReturnUrl,
  isHttpsUrl,
  shouldReuseArcaRegistration,
} from "@/lib/payments/arca/protocol";
import { logger } from "@/lib/observability/logger";

export type ArcaCheckoutPayload = {
  redirectUrl: string;
};

type PendingArcaPayment = {
  paymentId: string;
  providerReference: string | null;
  metadata: Record<string, unknown> | null;
};

function storedFormUrl(
  metadata: Record<string, unknown> | null,
): string | undefined {
  const url = metadata?.formUrl;
  if (typeof url === "string" && isHttpsUrl(url)) {
    return url;
  }
  return undefined;
}

function storedReturnUrl(
  metadata: Record<string, unknown> | null,
): string | undefined {
  const url = metadata?.returnUrl;
  return typeof url === "string" && url.trim().length > 0 ? url.trim() : undefined;
}

async function loadPendingArcaPayment(
  orderNumber: string,
): Promise<PendingArcaPayment | null> {
  const [row] = await getDb()
    .select({
      paymentId: payments.id,
      providerReference: payments.providerReference,
      metadata: payments.metadata,
      paymentStatus: payments.status,
    })
    .from(orders)
    .innerJoin(payments, eq(payments.orderId, orders.id))
    .where(
      and(eq(orders.orderNumber, orderNumber), eq(payments.provider, "arca")),
    )
    .limit(1);
  if (!row || row.paymentStatus !== "PENDING") {
    return null;
  }
  return {
    paymentId: row.paymentId,
    providerReference: row.providerReference,
    metadata: row.metadata,
  };
}

async function saveArcaRegistration(
  paymentId: string,
  arcaOrderId: string,
  formUrl: string,
  returnUrl: string,
  metadata: Record<string, unknown> | null,
): Promise<void> {
  await getDb()
    .update(payments)
    .set({
      providerReference: arcaOrderId,
      metadata: { ...metadata, formUrl, arcaOrderId, returnUrl },
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId));
}

/**
 * Registers the pending order with Arca and persists bank orderId.
 * Reuses a stored formUrl on retry; recovers from Arca when already registered.
 */
export async function registerArcaCheckout(input: {
  orderNumber: string;
  totalAmount: number;
  locale: Locale;
}): Promise<ArcaCheckoutPayload | null> {
  const credentials = getArcaCredentials();
  const payment = await loadPendingArcaPayment(input.orderNumber);
  if (!credentials || !payment) {
    return null;
  }
  const appUrl = await resolveCheckoutAppUrl();
  const returnUrl = arcaReturnUrl(appUrl, input.orderNumber);
  const existingUrl = storedFormUrl(payment.metadata);
  const cachedReturnUrl = storedReturnUrl(payment.metadata);
  const reuseRegistration = shouldReuseArcaRegistration({
    providerReference: payment.providerReference,
    formUrl: existingUrl,
    cachedReturnUrl,
    expectedReturnUrl: returnUrl,
    isDevelopment: process.env.NODE_ENV === "development",
  });
  if (reuseRegistration && existingUrl) {
    return { redirectUrl: existingUrl };
  }
  const registered = await registerArcaOrder(credentials, {
    orderNumber: input.orderNumber,
    totalAmount: input.totalAmount,
    locale: input.locale,
    appUrl,
  });
  if (registered.ok) {
    await saveArcaRegistration(
      payment.paymentId,
      registered.orderId,
      registered.formUrl,
      returnUrl,
      payment.metadata,
    );
    return { redirectUrl: registered.formUrl };
  }
  if (
    registered.errorCode === ARCA_REGISTER_ALREADY &&
    reuseRegistration &&
    existingUrl
  ) {
    return { redirectUrl: existingUrl };
  }
  if (registered.errorCode === ARCA_REGISTER_ALREADY && !reuseRegistration) {
    logger.warn("Arca checkout session cannot be reused locally", {
      orderNumber: input.orderNumber,
      cachedReturnUrl,
      returnUrl,
    });
    return null;
  }
  const recovered = await recoverArcaCheckoutRegistration(credentials, {
    orderNumber: input.orderNumber,
    locale: input.locale,
  });
  if (recovered) {
    await saveArcaRegistration(
      payment.paymentId,
      recovered.orderId,
      recovered.formUrl,
      returnUrl,
      payment.metadata,
    );
    return { redirectUrl: recovered.formUrl };
  }
  if (registered.errorCode === ARCA_REGISTER_ALREADY) {
    logger.warn("Arca order already registered", {
      orderNumber: input.orderNumber,
    });
  }
  return null;
}

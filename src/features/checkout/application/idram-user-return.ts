import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { failPendingIdramOrder } from "@/features/checkout/application/idram-order";
import { readIdramCallbackFields } from "@/lib/payments/idram/callback";
import { parseIdramRequestFields } from "@/lib/payments/idram/request-fields";
import { resolveIdramReturnLocale } from "@/lib/payments/idram/return-locale";
import type { Locale } from "@/lib/i18n/config";

function redirectTo(request: Request, locale: Locale, path: string): NextResponse {
  return NextResponse.redirect(new URL(`/${locale}${path}`, request.url));
}

async function fieldsFromRequest(
  request: Request,
): Promise<ReturnType<typeof readIdramCallbackFields>> {
  if (request.method === "GET") {
    return readIdramCallbackFields(
      parseIdramRequestFields(new URL(request.url).searchParams),
    );
  }
  try {
    return readIdramCallbackFields(
      parseIdramRequestFields(await request.formData()),
    );
  } catch {
    return readIdramCallbackFields(
      parseIdramRequestFields(new URL(request.url).searchParams),
    );
  }
}

async function loadReturnOrder(billNo: string | undefined): Promise<{
  orderNumber: string;
  locale: string;
  paymentStatus: string;
} | null> {
  if (!billNo) {
    return null;
  }
  const [order] = await getDb()
    .select({
      orderNumber: orders.orderNumber,
      locale: orders.locale,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.orderNumber, billNo))
    .limit(1);
  return order ?? null;
}

function successPath(order: {
  orderNumber: string;
  paymentStatus: string;
}): string {
  if (order.paymentStatus === "CAPTURED") {
    return `/checkout/success/${order.orderNumber}`;
  }
  if (order.paymentStatus === "PENDING") {
    return `/checkout/pending/${order.orderNumber}`;
  }
  return "/checkout?payment=failed";
}

/** SUCCESS_URL — never marks paid; redirects from current payment status. */
export async function handleIdramSuccess(
  request: Request,
): Promise<NextResponse> {
  const fields = await fieldsFromRequest(request);
  const order = await loadReturnOrder(fields.billNo);
  const locale = resolveIdramReturnLocale(request, order?.locale);
  if (!order) {
    return redirectTo(request, locale, "/checkout");
  }
  return redirectTo(request, locale, successPath(order));
}

/** FAIL_URL — fail pending payment, then send the user back to checkout. */
export async function handleIdramError(
  request: Request,
): Promise<NextResponse> {
  const fields = await fieldsFromRequest(request);
  const order = await loadReturnOrder(fields.billNo);
  const locale = resolveIdramReturnLocale(request, order?.locale);
  if (order?.paymentStatus === "CAPTURED") {
    return redirectTo(
      request,
      locale,
      `/checkout/success/${order.orderNumber}`,
    );
  }
  if (order && order.paymentStatus === "PENDING") {
    await failPendingIdramOrder(order.orderNumber);
  }
  return redirectTo(request, locale, "/checkout?payment=failed");
}

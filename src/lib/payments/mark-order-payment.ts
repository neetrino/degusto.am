import { db } from "@white-shop/db";
import type { Prisma } from "@prisma/client";
import { clearUserCartAfterPayment } from "./clear-cart-after-payment";
import { PAYMENT_STATUS } from "./constants";

type MarkPaidInput = {
  orderId: string;
  paymentId: string;
  providerTransactionId: string;
  providerResponse?: Prisma.InputJsonValue;
};

type MarkFailedInput = {
  orderId: string;
  paymentId: string;
  errorCode?: string;
  errorMessage?: string;
  providerResponse?: Prisma.InputJsonValue;
};

/** Mark order/payment as paid (idempotent if already paid). */
export async function markOrderPaymentPaid(input: MarkPaidInput): Promise<boolean> {
  const existing = await db.order.findUnique({
    where: { id: input.orderId },
    select: { paymentStatus: true, userId: true },
  });

  if (existing?.paymentStatus === PAYMENT_STATUS.paid) {
    return false;
  }

  const now = new Date();
  await db.$transaction([
    db.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: PAYMENT_STATUS.paid,
        status: "confirmed",
        paidAt: now,
      },
    }),
    db.payment.update({
      where: { id: input.paymentId },
      data: {
        status: PAYMENT_STATUS.paid,
        providerTransactionId: input.providerTransactionId,
        completedAt: now,
        ...(input.providerResponse ? { providerResponse: input.providerResponse } : {}),
      },
    }),
    db.orderEvent.create({
      data: {
        orderId: input.orderId,
        type: "payment_paid",
        data: { providerTransactionId: input.providerTransactionId },
      },
    }),
  ]);

  await clearUserCartAfterPayment(existing?.userId);

  return true;
}

/** Mark order/payment as failed (idempotent if already paid). */
export async function markOrderPaymentFailed(input: MarkFailedInput): Promise<boolean> {
  const existing = await db.order.findUnique({
    where: { id: input.orderId },
    select: { paymentStatus: true },
  });

  if (existing?.paymentStatus === PAYMENT_STATUS.paid) {
    return false;
  }

  const now = new Date();
  await db.$transaction([
    db.order.update({
      where: { id: input.orderId },
      data: {
        paymentStatus: PAYMENT_STATUS.failed,
      },
    }),
    db.payment.update({
      where: { id: input.paymentId },
      data: {
        status: PAYMENT_STATUS.failed,
        failedAt: now,
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        ...(input.providerResponse ? { providerResponse: input.providerResponse } : {}),
      },
    }),
    db.orderEvent.create({
      data: {
        orderId: input.orderId,
        type: "payment_failed",
        data: {
          errorCode: input.errorCode ?? null,
          errorMessage: input.errorMessage ?? null,
        },
      },
    }),
  ]);

  return true;
}

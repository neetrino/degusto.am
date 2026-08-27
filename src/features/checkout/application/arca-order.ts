import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orderEvents, orders, payments } from "@/db/schema";
import { withTransaction, type DbTransaction } from "@/db/transaction";
import { revalidateCartPaths } from "@/features/cart/cart";
import {
  convertUserCart,
  decrementStockForCapturedOrder,
} from "@/features/checkout/application/idram-fulfill";
import { isPaymentStatus } from "@/features/orders/domain/payment-status";
import { createId } from "@/lib/id";
import { logger } from "@/lib/observability/logger";

export type ArcaPaymentSnapshot = {
  orderId: string;
  userId: string | null;
  orderNumber: string;
  locale: string;
  totalAmount: number;
  paymentId: string;
  paymentStatus: string;
  providerReference: string | null;
};

type LockedArcaOrder = {
  orderId: string;
  userId: string | null;
  orderNumber: string;
  paymentId: string;
  paymentStatus: string;
};

async function lockArcaOrder(
  tx: DbTransaction,
  orderNumber: string,
): Promise<LockedArcaOrder | null> {
  const [order] = await tx
    .select({
      id: orders.id,
      userId: orders.userId,
      orderNumber: orders.orderNumber,
    })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .for("update")
    .limit(1);
  if (!order) {
    return null;
  }
  const [payment] = await tx
    .select({ id: payments.id, status: payments.status })
    .from(payments)
    .where(and(eq(payments.orderId, order.id), eq(payments.provider, "arca")))
    .for("update")
    .limit(1);
  if (!payment) {
    return null;
  }
  return {
    orderId: order.id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    paymentId: payment.id,
    paymentStatus: payment.status,
  };
}

async function markArcaOrderCaptured(
  tx: DbTransaction,
  orderId: string,
  paymentId: string,
  now: Date,
): Promise<void> {
  await tx
    .update(orders)
    .set({
      status: "CONFIRMED",
      paymentStatus: "CAPTURED",
      updatedAt: now,
    })
    .where(eq(orders.id, orderId));
  await tx
    .update(payments)
    .set({ status: "CAPTURED", updatedAt: now })
    .where(eq(payments.id, paymentId));
  await tx.insert(orderEvents).values({
    id: createId(),
    orderId,
    eventType: "PAYMENT_PROVIDER",
    fromState: "PENDING",
    toState: "CAPTURED",
    isCustomerVisible: true,
    payload: { provider: "arca" },
  });
  await tx.insert(orderEvents).values({
    id: createId(),
    orderId,
    eventType: "STATUS_CHANGE",
    fromState: "PENDING",
    toState: "CONFIRMED",
    isCustomerVisible: true,
    payload: { source: "arca" },
  });
}

/**
 * Marks the Arca payment captured, confirms the order, decrements stock,
 * and clears the logged-in cart. Idempotent when already CAPTURED.
 */
export async function captureArcaOrder(
  orderNumber: string,
): Promise<"applied" | "already" | "missing"> {
  const outcome = await withTransaction(async (tx) => {
    const locked = await lockArcaOrder(tx, orderNumber);
    if (!locked) {
      return "missing" as const;
    }
    if (locked.paymentStatus === "CAPTURED") {
      return "already" as const;
    }
    if (locked.paymentStatus !== "PENDING") {
      return "missing" as const;
    }
    const now = new Date();
    await markArcaOrderCaptured(tx, locked.orderId, locked.paymentId, now);
    if (locked.userId) {
      await convertUserCart(tx, locked.userId, now);
    }
    await decrementStockForCapturedOrder(
      tx,
      locked.orderId,
      locked.orderNumber,
      now,
    );
    return "applied" as const;
  });
  if (outcome === "applied") {
    await revalidateCartPaths();
    logger.info("Arca payment captured", { orderNumber });
  }
  return outcome;
}

/** Return URL: mark pending Arca payment failed and cancel the unpaid order. */
export async function failPendingArcaOrder(
  orderNumber: string,
): Promise<void> {
  await withTransaction(async (tx) => {
    const locked = await lockArcaOrder(tx, orderNumber);
    if (!locked || locked.paymentStatus !== "PENDING") {
      return;
    }
    const now = new Date();
    await tx
      .update(orders)
      .set({
        status: "CANCELLED",
        paymentStatus: "FAILED",
        updatedAt: now,
      })
      .where(eq(orders.id, locked.orderId));
    await tx
      .update(payments)
      .set({ status: "FAILED", updatedAt: now })
      .where(eq(payments.id, locked.paymentId));
    await tx.insert(orderEvents).values({
      id: createId(),
      orderId: locked.orderId,
      eventType: "STATUS_CHANGE",
      fromState: "PENDING",
      toState: "CANCELLED",
      isCustomerVisible: true,
      payload: { source: "arca_fail" },
    });
  });
}

export async function loadArcaPaymentByOrderNumber(
  orderNumber: string,
): Promise<ArcaPaymentSnapshot | null> {
  const [row] = await getDb()
    .select({
      orderId: orders.id,
      userId: orders.userId,
      orderNumber: orders.orderNumber,
      locale: orders.locale,
      totalAmount: orders.totalAmount,
      paymentId: payments.id,
      paymentStatus: payments.status,
      providerReference: payments.providerReference,
    })
    .from(orders)
    .innerJoin(payments, eq(payments.orderId, orders.id))
    .where(
      and(eq(orders.orderNumber, orderNumber), eq(payments.provider, "arca")),
    )
    .limit(1);
  if (!row || !isPaymentStatus(row.paymentStatus)) {
    return null;
  }
  return row;
}

export async function loadArcaPaymentByBankOrderId(
  bankOrderId: string,
): Promise<ArcaPaymentSnapshot | null> {
  const [row] = await getDb()
    .select({
      orderId: orders.id,
      userId: orders.userId,
      orderNumber: orders.orderNumber,
      locale: orders.locale,
      totalAmount: orders.totalAmount,
      paymentId: payments.id,
      paymentStatus: payments.status,
      providerReference: payments.providerReference,
    })
    .from(payments)
    .innerJoin(orders, eq(orders.id, payments.orderId))
    .where(
      and(
        eq(payments.provider, "arca"),
        eq(payments.providerReference, bankOrderId),
      ),
    )
    .limit(1);
  if (!row || !isPaymentStatus(row.paymentStatus)) {
    return null;
  }
  return row;
}

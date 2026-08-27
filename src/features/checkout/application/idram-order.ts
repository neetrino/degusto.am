import { and, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orderEvents, orders, payments } from "@/db/schema";
import { withTransaction, type DbTransaction } from "@/db/transaction";
import { revalidateCartPaths } from "@/features/cart/cart";
import {
  convertUserCart,
  decrementStockForCapturedOrder,
  markIdramOrderCaptured,
} from "@/features/checkout/application/idram-fulfill";
import { isPaymentStatus } from "@/features/orders/domain/payment-status";
import { createId } from "@/lib/id";
import { logger } from "@/lib/observability/logger";
import type { IdramOrderSnapshot } from "@/lib/payments/idram/callback";

/** Loads Idram payment snapshot by public order number (EDP_BILL_NO). */
export async function loadIdramOrderSnapshot(
  billNo: string,
): Promise<IdramOrderSnapshot | null> {
  const [row] = await getDb()
    .select({
      orderNumber: orders.orderNumber,
      totalAmount: orders.totalAmount,
      paymentStatus: payments.status,
      paymentProvider: payments.provider,
    })
    .from(orders)
    .innerJoin(payments, eq(payments.orderId, orders.id))
    .where(
      and(eq(orders.orderNumber, billNo), eq(payments.provider, "idram")),
    )
    .limit(1);
  if (!row || !isPaymentStatus(row.paymentStatus)) {
    return null;
  }
  return {
    orderNumber: row.orderNumber,
    totalAmount: row.totalAmount,
    paymentStatus: row.paymentStatus,
    paymentProvider: row.paymentProvider,
  };
}

type LockedIdramOrder = {
  orderId: string;
  userId: string | null;
  orderNumber: string;
  paymentId: string;
  paymentStatus: string;
};

async function lockIdramOrder(
  tx: DbTransaction,
  orderNumber: string,
): Promise<LockedIdramOrder | null> {
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
    .where(and(eq(payments.orderId, order.id), eq(payments.provider, "idram")))
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

/**
 * Marks the Idram payment captured, confirms the order, decrements stock,
 * and clears the logged-in cart. Idempotent when already CAPTURED.
 */
export async function captureIdramOrder(
  orderNumber: string,
  transId: string,
): Promise<"applied" | "already" | "missing"> {
  const outcome = await withTransaction(async (tx) => {
    const locked = await lockIdramOrder(tx, orderNumber);
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
    await markIdramOrderCaptured(
      tx,
      locked.orderId,
      locked.paymentId,
      transId,
      now,
    );
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
    logger.info("Idram payment captured", { orderNumber });
  }
  return outcome;
}

/** FAIL_URL: mark pending Idram payment failed and cancel the unpaid order. */
export async function failPendingIdramOrder(
  orderNumber: string,
): Promise<void> {
  await withTransaction(async (tx) => {
    const locked = await lockIdramOrder(tx, orderNumber);
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
      payload: { source: "idram_fail" },
    });
  });
}

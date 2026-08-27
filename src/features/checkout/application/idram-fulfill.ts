import { and, eq, sql } from "drizzle-orm";

import {
  cartItems,
  carts,
  orderEvents,
  orderItems,
  orders,
  payments,
  products,
  stockMovements,
} from "@/db/schema";
import type { DbTransaction } from "@/db/transaction";
import { createId } from "@/lib/id";
import { logger } from "@/lib/observability/logger";

async function orderAlreadyDecremented(
  tx: DbTransaction,
  orderId: string,
): Promise<boolean> {
  const [existing] = await tx
    .select({ id: stockMovements.id })
    .from(stockMovements)
    .where(
      and(
        eq(stockMovements.orderId, orderId),
        eq(stockMovements.reason, "ORDER"),
      ),
    )
    .limit(1);
  return Boolean(existing);
}

async function decrementLine(
  tx: DbTransaction,
  line: { productId: string | null; quantity: number },
  orderId: string,
  orderNumber: string,
  now: Date,
): Promise<void> {
  if (!line.productId) {
    return;
  }
  const [product] = await tx
    .select()
    .from(products)
    .where(eq(products.id, line.productId))
    .for("update")
    .limit(1);
  if (!product) {
    logger.warn("Idram stock skip: product missing", { orderNumber });
    return;
  }
  if (product.stockOnHand < line.quantity) {
    logger.warn("Idram stock skip: insufficient", {
      orderNumber,
      sku: product.sku,
      onHand: product.stockOnHand,
      needed: line.quantity,
    });
    return;
  }
  const nextStock = product.stockOnHand - line.quantity;
  await tx
    .update(products)
    .set({
      stockOnHand: nextStock,
      version: sql`${products.version} + 1`,
      updatedAt: now,
    })
    .where(eq(products.id, product.id));
  await tx.insert(stockMovements).values({
    id: createId(),
    productId: product.id,
    delta: -line.quantity,
    reason: "ORDER",
    orderId,
    resultingBalance: nextStock,
    correlationId: orderNumber,
  });
}

/** Decrements stock for a paid Idram order unless an ORDER movement already exists. */
export async function decrementStockForCapturedOrder(
  tx: DbTransaction,
  orderId: string,
  orderNumber: string,
  now: Date,
): Promise<void> {
  if (await orderAlreadyDecremented(tx, orderId)) {
    return;
  }
  const lines = await tx
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  for (const line of lines) {
    await decrementLine(tx, line, orderId, orderNumber, now);
  }
}

/** Converts the logged-in customer's active cart after Idram confirm. */
export async function convertUserCart(
  tx: DbTransaction,
  userId: string,
  now: Date,
): Promise<void> {
  const [cart] = await tx
    .select({ id: carts.id })
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, "ACTIVE")))
    .limit(1);
  if (!cart) {
    return;
  }
  await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  await tx
    .update(carts)
    .set({ status: "CONVERTED", updatedAt: now })
    .where(eq(carts.id, cart.id));
}

export async function markIdramOrderCaptured(
  tx: DbTransaction,
  orderId: string,
  paymentId: string,
  transId: string,
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
    .set({
      status: "CAPTURED",
      providerReference: transId,
      updatedAt: now,
    })
    .where(eq(payments.id, paymentId));
  await tx.insert(orderEvents).values({
    id: createId(),
    orderId,
    eventType: "PAYMENT_PROVIDER",
    fromState: "PENDING",
    toState: "CAPTURED",
    isCustomerVisible: true,
    providerEventId: transId,
    payload: { provider: "idram" },
  });
  await tx.insert(orderEvents).values({
    id: createId(),
    orderId,
    eventType: "STATUS_CHANGE",
    fromState: "PENDING",
    toState: "CONFIRMED",
    isCustomerVisible: true,
    payload: { source: "idram" },
  });
}

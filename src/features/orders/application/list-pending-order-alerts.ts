import "server-only";

import { and, desc, eq, gt } from "drizzle-orm";

import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { latestPaymentMethodSql } from "@/features/orders/application/latest-payment-method-sql";

/** Cap alert payload size for a single poll. */
const PENDING_ORDER_ALERT_LIMIT = 50;

export type PendingOrderAlert = {
  id: string;
  orderNumber: string;
  contactName: string;
  totalAmount: number;
  baseCurrency: string;
  paymentMethod: string | null;
  placedAt: Date;
};

/**
 * Lists active PENDING orders placed after `afterPlacedAt` for staff alerts.
 * Newest first.
 */
export async function listPendingOrderAlerts(
  afterPlacedAt: Date,
): Promise<PendingOrderAlert[]> {
  return getDb()
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      contactName: orders.contactName,
      totalAmount: orders.totalAmount,
      baseCurrency: orders.baseCurrency,
      paymentMethod: latestPaymentMethodSql,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.status, "PENDING"),
        eq(orders.isArchived, false),
        gt(orders.placedAt, afterPlacedAt),
      ),
    )
    .orderBy(desc(orders.placedAt))
    .limit(PENDING_ORDER_ALERT_LIMIT);
}

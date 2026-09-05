import "server-only";

import { and, eq, notInArray, type SQL } from "drizzle-orm";

import { orders } from "@/db/schema";
import {
  EXCLUDED_REVENUE_ORDER_STATUSES,
  EXCLUDED_REVENUE_PAYMENT_STATUSES,
} from "@/features/analytics/domain/revenue-eligibility";

/**
 * Non-archived orders without a negative fulfillment or payment status.
 * Shared by dashboard, analytics, and ranking queries.
 */
export function revenueEligibleOrderWhere(): SQL {
  return and(
    eq(orders.isArchived, false),
    notInArray(orders.status, [...EXCLUDED_REVENUE_ORDER_STATUSES]),
    notInArray(orders.paymentStatus, [
      ...EXCLUDED_REVENUE_PAYMENT_STATUSES,
    ]),
  )!;
}

import "server-only";

import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  orderEvents,
  orderItems,
  orders,
  payments,
  products,
  users,
} from "@/db/schema";
import { latestPaymentMethodSql } from "@/features/orders/application/latest-payment-method-sql";
import { revenueEligibleOrderWhere } from "@/features/analytics/application/revenue-where";
import { comparableAnalyticsPeriodBounds } from "@/features/analytics/domain/date-range";
import type { AdminOrdersFilter } from "@/features/orders/schemas/change-status";

const PAGE_SIZE = 20;

export type AdminOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: Date;
  isArchived: boolean;
};

export type AdminOrderDetail = {
  order: typeof orders.$inferSelect;
  items: Array<typeof orderItems.$inferSelect>;
  events: Array<typeof orderEvents.$inferSelect>;
  payments: Array<typeof payments.$inferSelect>;
};

function buildOrderFilters(filters: AdminOrdersFilter): SQL | undefined {
  const conditions: SQL[] = [];

  if (filters.archived === "active") {
    conditions.push(eq(orders.isArchived, false));
  } else if (filters.archived === "archived") {
    conditions.push(eq(orders.isArchived, true));
  }

  if (filters.status) {
    conditions.push(eq(orders.status, filters.status));
  }

  if (filters.paymentStatus) {
    conditions.push(eq(orders.paymentStatus, filters.paymentStatus));
  }

  if (filters.dateFrom) {
    conditions.push(
      gte(orders.placedAt, new Date(`${filters.dateFrom}T00:00:00.000Z`)),
    );
  }

  if (filters.dateTo) {
    conditions.push(
      lte(orders.placedAt, new Date(`${filters.dateTo}T23:59:59.999Z`)),
    );
  }

  if (filters.q) {
    const pattern = `%${filters.q}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, pattern),
        ilike(orders.contactEmail, pattern),
        ilike(orders.contactName, pattern),
        ilike(orders.contactPhone, pattern),
      )!,
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

const adminOrderListSelect = {
  id: orders.id,
  orderNumber: orders.orderNumber,
  status: orders.status,
  paymentStatus: orders.paymentStatus,
  paymentMethod: latestPaymentMethodSql,
  contactName: orders.contactName,
  contactEmail: orders.contactEmail,
  contactPhone: orders.contactPhone,
  totalAmount: orders.totalAmount,
  baseCurrency: orders.baseCurrency,
  placedAt: orders.placedAt,
  isArchived: orders.isArchived,
};

/** Lists orders for the admin surface with optional status/search filters. */
export async function listAdminOrders(
  filters: AdminOrdersFilter,
): Promise<{ rows: AdminOrderListItem[]; total: number; pageSize: number }> {
  const where = buildOrderFilters(filters);
  const offset = (filters.page - 1) * PAGE_SIZE;

  const [rows, [totalRow]] = await Promise.all([
    getDb()
      .select(adminOrderListSelect)
      .from(orders)
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    getDb().select({ value: count() }).from(orders).where(where),
  ]);

  return {
    rows,
    total: totalRow?.value ?? 0,
    pageSize: PAGE_SIZE,
  };
}

/**
 * Lists orders belonging to a single customer (profile surface).
 * Same shape as admin list rows; always scoped to `userId`.
 */
export async function listCustomerOrders(
  userId: string,
  filters: AdminOrdersFilter,
): Promise<{ rows: AdminOrderListItem[]; total: number; pageSize: number }> {
  const baseWhere = buildOrderFilters(filters);
  const where = baseWhere
    ? and(eq(orders.userId, userId), baseWhere)
    : eq(orders.userId, userId);
  const offset = (filters.page - 1) * PAGE_SIZE;

  const [rows, [totalRow]] = await Promise.all([
    getDb()
      .select(adminOrderListSelect)
      .from(orders)
      .where(where)
      .orderBy(desc(orders.placedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    getDb().select({ value: count() }).from(orders).where(where),
  ]);

  return {
    rows,
    total: totalRow?.value ?? 0,
    pageSize: PAGE_SIZE,
  };
}

/** Loads a single order with line items and immutable event history. */
export async function getAdminOrderByNumber(
  orderNumber: string,
): Promise<AdminOrderDetail | null> {
  const [order] = await getDb()
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (!order) {
    return null;
  }

  const [items, events, paymentRows] = await Promise.all([
    getDb()
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id)),
    getDb()
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, order.id))
      .orderBy(desc(orderEvents.createdAt)),
    getDb()
      .select()
      .from(payments)
      .where(eq(payments.orderId, order.id))
      .orderBy(desc(payments.attemptNumber)),
  ]);

  return { order, items, events, payments: paymentRows };
}

export type DashboardMetrics = {
  users: number;
  products: number;
  orders: number;
  revenueAmount: number;
  previousRevenueAmount: number;
  recentOrders: AdminOrderListItem[];
  topProducts: Array<{ productId: string; title: string; quantity: number }>;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
};

function periodBounds(from: string, to: string) {
  return comparableAnalyticsPeriodBounds(from, to);
}

/** Admin dashboard cards with previous-period revenue comparison. */
export async function getAdminDashboardMetrics(input: {
  from: string;
  to: string;
}): Promise<DashboardMetrics> {
  const bounds = periodBounds(input.from, input.to);

  const [
    [usersRow],
    [productsRow],
    [metricsRow],
    [previousRevenueRow],
    recentOrders,
    topProductRows,
  ] = await Promise.all([
    getDb().select({ value: count() }).from(users),
    getDb()
      .select({ value: count() })
      .from(products)
      .where(eq(products.status, "ACTIVE")),
    getDb()
      .select({
        orderCount: count(),
        revenueAmount: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`.mapWith(
          Number,
        ),
      })
      .from(orders)
      .where(
        and(
          revenueEligibleOrderWhere(),
          gte(orders.placedAt, bounds.start),
          lte(orders.placedAt, bounds.end),
        ),
      ),
    getDb()
      .select({
        value: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`.mapWith(
          Number,
        ),
      })
      .from(orders)
      .where(
        and(
          revenueEligibleOrderWhere(),
          gte(orders.placedAt, bounds.previousStart),
          lte(orders.placedAt, bounds.previousEnd),
        ),
      ),
    getDb()
      .select(adminOrderListSelect)
      .from(orders)
      .where(eq(orders.isArchived, false))
      .orderBy(desc(orders.placedAt))
      .limit(8),
    getDb()
      .select({
        productId: orderItems.productId,
        title: orderItems.productTitleSnapshot,
        quantity: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.mapWith(
          Number,
        ),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          revenueEligibleOrderWhere(),
          gte(orders.placedAt, bounds.start),
          lte(orders.placedAt, bounds.end),
        ),
      )
      .groupBy(orderItems.productId, orderItems.productTitleSnapshot)
      .orderBy(desc(sql`sum(${orderItems.quantity})`))
      .limit(5),
  ]);

  return {
    users: usersRow?.value ?? 0,
    products: productsRow?.value ?? 0,
    orders: metricsRow?.orderCount ?? 0,
    revenueAmount: metricsRow?.revenueAmount ?? 0,
    previousRevenueAmount: previousRevenueRow?.value ?? 0,
    recentOrders,
    topProducts: topProductRows.map((row) => ({
      productId: row.productId ?? "unknown",
      title: row.title,
      quantity: row.quantity,
    })),
    from: input.from,
    to: input.to,
    previousFrom: bounds.previousFrom,
    previousTo: bounds.previousTo,
  };
}

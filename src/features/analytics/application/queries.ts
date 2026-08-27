import "server-only";

import {
  and,
  count,
  countDistinct,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm";

import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import {
  queryTopCategories,
  queryTopSellingProducts,
  type AnalyticsTopCategory,
  type AnalyticsTopProduct,
} from "@/features/analytics/application/top-rankings";
import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import {
  ANALYTICS_OVERVIEW_PERIODS,
  fillDailyAnalyticsGaps,
  rangeForOverviewPeriod,
  type AnalyticsOverviewPeriod,
} from "@/features/analytics/domain/date-range";
import type { OrderStatus } from "@/features/orders/domain/order-status";
import { getStoreRevenue } from "@/features/settings/application/queries";
import type { Locale } from "@/lib/i18n/config";

export type {
  AnalyticsTopCategory,
  AnalyticsTopProduct,
} from "@/features/analytics/application/top-rankings";
export type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
export { buildAnalyticsCsv, guardCsvCell } from "@/features/analytics/domain/csv";

const CACHE_TTL_SECONDS = 300;
const CACHE_VERSION = "v2";
const cacheKeys = new Set<string>();

export type AnalyticsPeriodSnapshot = {
  id: AnalyticsOverviewPeriod;
  from: string;
  to: string;
  orderCount: number;
  revenueAmount: number;
  averageOrderValue: number;
  previousOrderCount: number;
  previousRevenueAmount: number;
  previousAverageOrderValue: number;
};

export type AnalyticsBestDay = {
  date: string;
  orderCount: number;
  revenueAmount: number;
};

export type AnalyticsSummary = {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  orderCount: number;
  revenueAmount: number;
  averageOrderValue: number;
  customerCount: number;
  previousOrderCount: number;
  previousRevenueAmount: number;
  previousAverageOrderValue: number;
  previousCustomerCount: number;
  dailyRows: AnalyticsCsvRow[];
  overview: AnalyticsPeriodSnapshot[];
  bestDay: AnalyticsBestDay | null;
  topProducts: AnalyticsTopProduct[];
  topCategories: AnalyticsTopCategory[];
};

function periodBounds(from: string, to: string): {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  previousFrom: string;
  previousTo: string;
} {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  const durationMs = Math.max(
    end.getTime() - start.getTime(),
    24 * 60 * 60 * 1000 - 1,
  );
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);

  return {
    start,
    end,
    previousStart,
    previousEnd,
    previousFrom: previousStart.toISOString().slice(0, 10),
    previousTo: previousEnd.toISOString().slice(0, 10),
  };
}

function averageOrderValue(revenue: number, orderCount: number): number {
  if (orderCount === 0) {
    return 0;
  }
  return Math.round((revenue / orderCount) * 100) / 100;
}

function cacheKey(from: string, to: string, locale: Locale): string {
  return `analytics:${CACHE_VERSION}:${locale}:${from}:${to}`;
}

async function queryPeriodMetrics(input: {
  start: Date;
  end: Date;
  revenueStatuses: OrderStatus[];
}): Promise<{ orderCount: number; revenueAmount: number }> {
  const where = and(
    eq(orders.isArchived, false),
    gte(orders.placedAt, input.start),
    lte(orders.placedAt, input.end),
  );

  const [[ordersRow], [revenueRow]] = await Promise.all([
    getDb().select({ value: count() }).from(orders).where(where),
    getDb()
      .select({
        value: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`.mapWith(
          Number,
        ),
      })
      .from(orders)
      .where(and(where, inArray(orders.status, input.revenueStatuses))),
  ]);

  return {
    orderCount: ordersRow?.value ?? 0,
    revenueAmount: revenueRow?.value ?? 0,
  };
}

async function queryCustomerCount(input: {
  start: Date;
  end: Date;
}): Promise<number> {
  const [row] = await getDb()
    .select({
      value: countDistinct(orders.contactEmail),
    })
    .from(orders)
    .where(
      and(
        eq(orders.isArchived, false),
        gte(orders.placedAt, input.start),
        lte(orders.placedAt, input.end),
      ),
    );

  return row?.value ?? 0;
}

async function queryDailyRows(input: {
  from: string;
  to: string;
  revenueStatuses: OrderStatus[];
}): Promise<AnalyticsCsvRow[]> {
  const bounds = periodBounds(input.from, input.to);
  const revenueStatusSql = sql.join(
    input.revenueStatuses.map((status) => sql`${status}`),
    sql`, `,
  );
  const rows = await getDb()
    .select({
      date: sql<string>`to_char(${orders.placedAt} at time zone 'UTC', 'YYYY-MM-DD')`,
      orderCount: count(),
      revenueAmount: sql<number>`coalesce(sum(case when ${orders.status} in (${revenueStatusSql}) then ${orders.totalAmount} else 0 end), 0)`.mapWith(
        Number,
      ),
    })
    .from(orders)
    .where(
      and(
        eq(orders.isArchived, false),
        gte(orders.placedAt, bounds.start),
        lte(orders.placedAt, bounds.end),
      ),
    )
    .groupBy(sql`to_char(${orders.placedAt} at time zone 'UTC', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.placedAt} at time zone 'UTC', 'YYYY-MM-DD')`);

  const mapped = rows.map((row) => ({
    date: row.date,
    orderCount: row.orderCount,
    revenueAmount: row.revenueAmount,
    averageOrderValue: averageOrderValue(row.revenueAmount, row.orderCount),
  }));

  return fillDailyAnalyticsGaps(input.from, input.to, mapped, (date) => ({
    date,
    orderCount: 0,
    revenueAmount: 0,
    averageOrderValue: 0,
  }));
}

function pickBestDay(rows: AnalyticsCsvRow[]): AnalyticsBestDay | null {
  let best: AnalyticsCsvRow | null = null;
  for (const row of rows) {
    if (row.revenueAmount <= 0 && row.orderCount <= 0) {
      continue;
    }
    if (
      !best ||
      row.revenueAmount > best.revenueAmount ||
      (row.revenueAmount === best.revenueAmount &&
        row.orderCount > best.orderCount)
    ) {
      best = row;
    }
  }
  if (!best) {
    return null;
  }
  return {
    date: best.date,
    orderCount: best.orderCount,
    revenueAmount: best.revenueAmount,
  };
}

async function queryOverviewSnapshots(
  revenueStatuses: OrderStatus[],
): Promise<AnalyticsPeriodSnapshot[]> {
  return Promise.all(
    ANALYTICS_OVERVIEW_PERIODS.map(async (id) => {
      const range = rangeForOverviewPeriod(id);
      const bounds = periodBounds(range.from, range.to);
      const [current, previous] = await Promise.all([
        queryPeriodMetrics({
          start: bounds.start,
          end: bounds.end,
          revenueStatuses,
        }),
        queryPeriodMetrics({
          start: bounds.previousStart,
          end: bounds.previousEnd,
          revenueStatuses,
        }),
      ]);

      return {
        id,
        from: range.from,
        to: range.to,
        orderCount: current.orderCount,
        revenueAmount: current.revenueAmount,
        averageOrderValue: averageOrderValue(
          current.revenueAmount,
          current.orderCount,
        ),
        previousOrderCount: previous.orderCount,
        previousRevenueAmount: previous.revenueAmount,
        previousAverageOrderValue: averageOrderValue(
          previous.revenueAmount,
          previous.orderCount,
        ),
      };
    }),
  );
}

async function computeAnalyticsSummary(input: {
  from: string;
  to: string;
  locale: Locale;
}): Promise<AnalyticsSummary> {
  const revenue = await getStoreRevenue();
  const revenueStatuses = revenue.statuses as OrderStatus[];
  const bounds = periodBounds(input.from, input.to);

  const [
    current,
    previous,
    dailyRows,
    customerCount,
    previousCustomerCount,
    topProducts,
    topCategories,
    overview,
  ] = await Promise.all([
    queryPeriodMetrics({
      start: bounds.start,
      end: bounds.end,
      revenueStatuses,
    }),
    queryPeriodMetrics({
      start: bounds.previousStart,
      end: bounds.previousEnd,
      revenueStatuses,
    }),
    queryDailyRows({
      from: input.from,
      to: input.to,
      revenueStatuses,
    }),
    queryCustomerCount({ start: bounds.start, end: bounds.end }),
    queryCustomerCount({
      start: bounds.previousStart,
      end: bounds.previousEnd,
    }),
    queryTopSellingProducts({
      start: bounds.start,
      end: bounds.end,
      revenueStatuses,
    }),
    queryTopCategories({
      start: bounds.start,
      end: bounds.end,
      revenueStatuses,
      locale: input.locale,
    }),
    queryOverviewSnapshots(revenueStatuses),
  ]);

  return {
    from: input.from,
    to: input.to,
    previousFrom: bounds.previousFrom,
    previousTo: bounds.previousTo,
    orderCount: current.orderCount,
    revenueAmount: current.revenueAmount,
    averageOrderValue: averageOrderValue(
      current.revenueAmount,
      current.orderCount,
    ),
    customerCount,
    previousOrderCount: previous.orderCount,
    previousRevenueAmount: previous.revenueAmount,
    previousAverageOrderValue: averageOrderValue(
      previous.revenueAmount,
      previous.orderCount,
    ),
    previousCustomerCount,
    dailyRows,
    overview,
    bestDay: pickBestDay(dailyRows),
    topProducts,
    topCategories,
  };
}

/** Loads analytics summary with Redis cache (300s TTL). */
export async function getAnalyticsSummary(input: {
  from: string;
  to: string;
  locale?: Locale;
}): Promise<AnalyticsSummary> {
  const locale = input.locale ?? "hy";
  const key = cacheKey(input.from, input.to, locale);
  const redis = getProviders().redis.getClient();
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached) as AnalyticsSummary;
  }

  const summary = await computeAnalyticsSummary({
    from: input.from,
    to: input.to,
    locale,
  });
  await redis.set(key, JSON.stringify(summary), { ex: CACHE_TTL_SECONDS });
  cacheKeys.add(key);
  return summary;
}

/** Deletes cached analytics keys (exact keys tracked in-process). */
export async function invalidateAnalyticsCache(): Promise<void> {
  const redis = getProviders().redis.getClient();
  await Promise.all(
    [...cacheKeys].map(async (key) => {
      await redis.del(key);
      cacheKeys.delete(key);
    }),
  );
}

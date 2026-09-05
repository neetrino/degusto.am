import "server-only";

import {
  and,
  count,
  countDistinct,
  gte,
  lte,
  sql,
} from "drizzle-orm";

import { getProviders } from "@/config/providers";
import { getDb } from "@/db/client";
import { orders } from "@/db/schema";
import { revenueEligibleOrderWhere } from "@/features/analytics/application/revenue-where";
import {
  queryTopCategories,
  queryTopSellingProducts,
  type AnalyticsTopCategory,
  type AnalyticsTopProduct,
} from "@/features/analytics/application/top-rankings";
import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import {
  ANALYTICS_OVERVIEW_PERIODS,
  comparableAnalyticsPeriodBounds,
  fillDailyAnalyticsGaps,
  rangeForOverviewPeriod,
  type AnalyticsOverviewPeriod,
} from "@/features/analytics/domain/date-range";
import { APP_TIMEZONE } from "@/lib/datetime/app-timezone";
import type { Locale } from "@/lib/i18n/config";

export type {
  AnalyticsTopCategory,
  AnalyticsTopProduct,
} from "@/features/analytics/application/top-rankings";
export type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
export { buildAnalyticsCsv, guardCsvCell } from "@/features/analytics/domain/csv";

const CACHE_TTL_SECONDS = 300;
const CACHE_VERSION = "v4";
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

function periodBounds(from: string, to: string) {
  return comparableAnalyticsPeriodBounds(from, to);
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
}): Promise<{ orderCount: number; revenueAmount: number }> {
  const [row] = await getDb()
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
        gte(orders.placedAt, input.start),
        lte(orders.placedAt, input.end),
      ),
    );

  return {
    orderCount: row?.orderCount ?? 0,
    revenueAmount: row?.revenueAmount ?? 0,
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
        revenueEligibleOrderWhere(),
        gte(orders.placedAt, input.start),
        lte(orders.placedAt, input.end),
      ),
    );

  return row?.value ?? 0;
}

async function queryDailyRows(input: {
  from: string;
  to: string;
}): Promise<AnalyticsCsvRow[]> {
  const bounds = periodBounds(input.from, input.to);
  const daySql = sql<string>`to_char(${orders.placedAt} at time zone ${sql.raw(`'${APP_TIMEZONE}'`)}, 'YYYY-MM-DD')`;
  const rows = await getDb()
    .select({
      date: daySql,
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
    )
    .groupBy(daySql)
    .orderBy(daySql);

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

async function queryOverviewSnapshots(): Promise<AnalyticsPeriodSnapshot[]> {
  return Promise.all(
    ANALYTICS_OVERVIEW_PERIODS.map(async (id) => {
      const range = rangeForOverviewPeriod(id);
      const bounds = periodBounds(range.from, range.to);
      const [current, previous] = await Promise.all([
        queryPeriodMetrics({
          start: bounds.start,
          end: bounds.end,
        }),
        queryPeriodMetrics({
          start: bounds.previousStart,
          end: bounds.previousEnd,
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
    }),
    queryPeriodMetrics({
      start: bounds.previousStart,
      end: bounds.previousEnd,
    }),
    queryDailyRows({
      from: input.from,
      to: input.to,
    }),
    queryCustomerCount({ start: bounds.start, end: bounds.end }),
    queryCustomerCount({
      start: bounds.previousStart,
      end: bounds.previousEnd,
    }),
    queryTopSellingProducts({
      start: bounds.start,
      end: bounds.end,
    }),
    queryTopCategories({
      start: bounds.start,
      end: bounds.end,
      locale: input.locale,
    }),
    queryOverviewSnapshots(),
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
    try {
      return JSON.parse(cached) as AnalyticsSummary;
    } catch {
      await redis.del(key);
    }
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

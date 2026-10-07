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
import { latestPaymentMethodBucketSql } from "@/features/analytics/application/payment-method-where";
import { revenueEligibleOrderWhere } from "@/features/analytics/application/revenue-where";
import {
  queryTodaySoldItems,
  type AnalyticsTodaySoldItem,
} from "@/features/analytics/application/today-sold-items";
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
import {
  buildPaymentBreakdown,
  type PaymentBreakdownRow,
} from "@/features/analytics/domain/payment-breakdown";
import type {
  AnalyticsPaymentMethod,
  AnalyticsPaymentMethodFilter,
} from "@/features/analytics/domain/payment-method-filter";
import { ANALYTICS_PAYMENT_METHODS } from "@/features/analytics/domain/payment-method-filter";
import {
  buildShippingBreakdown,
  type AnalyticsShippingMethod,
  type ShippingBreakdownRow,
} from "@/features/analytics/domain/shipping-breakdown";
import { APP_TIMEZONE } from "@/lib/datetime/app-timezone";
import type { Locale } from "@/lib/i18n/config";

export type {
  AnalyticsTopCategory,
  AnalyticsTopProduct,
} from "@/features/analytics/application/top-rankings";
export type { AnalyticsTodaySoldItem } from "@/features/analytics/application/today-sold-items";
export type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
export { buildAnalyticsCsv, guardCsvCell } from "@/features/analytics/domain/csv";
export type {
  AnalyticsPaymentMethod,
  AnalyticsPaymentMethodFilter,
} from "@/features/analytics/domain/payment-method-filter";
export type {
  AnalyticsShippingMethod,
  ShippingBreakdownRow,
} from "@/features/analytics/domain/shipping-breakdown";

const CACHE_TTL_SECONDS = 300;
const CACHE_VERSION = "v12";

/** Matches order-detail pickup detection (`deliveryLabelSnapshot === "Store pickup"`). */
function shippingMethodBucketSql() {
  return sql<string>`
    case
      when ${orders.deliveryLabelSnapshot} = 'Store pickup' then 'pickup'
      else 'delivery'
    end
  `;
}
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

export type AnalyticsPaymentBreakdownRow = PaymentBreakdownRow;
export type AnalyticsShippingBreakdownRow = ShippingBreakdownRow;

export type AnalyticsSummary = {
  from: string;
  to: string;
  paymentMethod: AnalyticsPaymentMethodFilter;
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
  paymentBreakdown: AnalyticsPaymentBreakdownRow[];
  shippingBreakdown: AnalyticsShippingBreakdownRow[];
  bestDay: AnalyticsBestDay | null;
  topProducts: AnalyticsTopProduct[];
  topCategories: AnalyticsTopCategory[];
  todaySoldItems: AnalyticsTodaySoldItem[];
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

function cacheKey(
  from: string,
  to: string,
  locale: Locale,
  paymentMethod: AnalyticsPaymentMethodFilter,
): string {
  return `analytics:${CACHE_VERSION}:${locale}:${paymentMethod}:${from}:${to}`;
}

async function queryPeriodMetrics(input: {
  start: Date;
  end: Date;
  paymentMethod?: AnalyticsPaymentMethodFilter;
}): Promise<{ orderCount: number; revenueAmount: number }> {
  const paymentMethod = input.paymentMethod ?? "all";
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
        revenueEligibleOrderWhere(paymentMethod),
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
  paymentMethod?: AnalyticsPaymentMethodFilter;
}): Promise<number> {
  const paymentMethod = input.paymentMethod ?? "all";
  const [row] = await getDb()
    .select({
      value: countDistinct(orders.contactEmail),
    })
    .from(orders)
    .where(
      and(
        revenueEligibleOrderWhere(paymentMethod),
        gte(orders.placedAt, input.start),
        lte(orders.placedAt, input.end),
      ),
    );

  return row?.value ?? 0;
}

async function queryDailyRows(input: {
  from: string;
  to: string;
  paymentMethod: AnalyticsPaymentMethodFilter;
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
        revenueEligibleOrderWhere(input.paymentMethod),
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

/**
 * Fixed today/week/month/quarter KPIs — always all payment methods.
 * Selected-range filters must not change these cards (different date windows).
 */
async function queryOverviewSnapshots(): Promise<AnalyticsPeriodSnapshot[]> {
  return Promise.all(
    ANALYTICS_OVERVIEW_PERIODS.map(async (id) => {
      const range = rangeForOverviewPeriod(id);
      const bounds = periodBounds(range.from, range.to);
      const [current, previous] = await Promise.all([
        queryPeriodMetrics({
          start: bounds.start,
          end: bounds.end,
          paymentMethod: "all",
        }),
        queryPeriodMetrics({
          start: bounds.previousStart,
          end: bounds.previousEnd,
          paymentMethod: "all",
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

/** Per-method totals for the selected date range (all methods, unfiltered). */
async function queryPaymentMethodTotals(input: {
  start: Date;
  end: Date;
}): Promise<Map<AnalyticsPaymentMethod, { orderCount: number; revenueAmount: number }>> {
  const methodBucket = latestPaymentMethodBucketSql();
  const rows = await getDb()
    .select({
      method: methodBucket,
      orderCount: count(),
      revenueAmount: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`.mapWith(
        Number,
      ),
    })
    .from(orders)
    .where(
      and(
        revenueEligibleOrderWhere("all"),
        gte(orders.placedAt, input.start),
        lte(orders.placedAt, input.end),
      ),
    )
    .groupBy(methodBucket);

  const byMethod = new Map<
    AnalyticsPaymentMethod,
    { orderCount: number; revenueAmount: number }
  >();
  for (const row of rows) {
    const method = row.method.trim();
    if (!(ANALYTICS_PAYMENT_METHODS as readonly string[]).includes(method)) {
      continue;
    }
    byMethod.set(method as AnalyticsPaymentMethod, {
      orderCount: row.orderCount,
      revenueAmount: row.revenueAmount,
    });
  }
  return byMethod;
}

/**
 * Pickup vs delivery totals for the selected date range.
 * Respects the active payment-method filter (e.g. Idram-only split).
 */
async function queryShippingMethodTotals(input: {
  start: Date;
  end: Date;
  paymentMethod: AnalyticsPaymentMethodFilter;
}): Promise<
  Map<AnalyticsShippingMethod, { orderCount: number; revenueAmount: number }>
> {
  const shippingBucket = shippingMethodBucketSql();
  const rows = await getDb()
    .select({
      method: shippingBucket,
      orderCount: count(),
      revenueAmount: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`.mapWith(
        Number,
      ),
    })
    .from(orders)
    .where(
      and(
        revenueEligibleOrderWhere(input.paymentMethod),
        gte(orders.placedAt, input.start),
        lte(orders.placedAt, input.end),
      ),
    )
    .groupBy(shippingBucket);

  const byMethod = new Map<
    AnalyticsShippingMethod,
    { orderCount: number; revenueAmount: number }
  >();
  for (const row of rows) {
    const method = row.method.trim();
    if (method !== "pickup" && method !== "delivery") {
      continue;
    }
    byMethod.set(method, {
      orderCount: row.orderCount,
      revenueAmount: row.revenueAmount,
    });
  }
  return byMethod;
}

async function computeAnalyticsSummary(input: {
  from: string;
  to: string;
  locale: Locale;
  paymentMethod: AnalyticsPaymentMethodFilter;
}): Promise<AnalyticsSummary> {
  const bounds = periodBounds(input.from, input.to);
  const { paymentMethod } = input;
  /** Rankings always reflect today — independent of the selected date range. */
  const todayRange = rangeForOverviewPeriod("today");
  const todayBounds = periodBounds(todayRange.from, todayRange.to);

  const [
    current,
    previous,
    dailyRows,
    customerCount,
    previousCustomerCount,
    topProducts,
    topCategories,
    todaySoldItems,
    overview,
    paymentTotals,
    shippingTotals,
  ] = await Promise.all([
    queryPeriodMetrics({
      start: bounds.start,
      end: bounds.end,
      paymentMethod,
    }),
    queryPeriodMetrics({
      start: bounds.previousStart,
      end: bounds.previousEnd,
      paymentMethod,
    }),
    queryDailyRows({
      from: input.from,
      to: input.to,
      paymentMethod,
    }),
    queryCustomerCount({
      start: bounds.start,
      end: bounds.end,
      paymentMethod,
    }),
    queryCustomerCount({
      start: bounds.previousStart,
      end: bounds.previousEnd,
      paymentMethod,
    }),
    queryTopSellingProducts({
      start: todayBounds.start,
      end: todayBounds.end,
      paymentMethod,
    }),
    queryTopCategories({
      start: todayBounds.start,
      end: todayBounds.end,
      locale: input.locale,
      paymentMethod,
    }),
    queryTodaySoldItems({
      start: todayBounds.start,
      end: todayBounds.end,
      paymentMethod,
    }),
    queryOverviewSnapshots(),
    paymentMethod === "all"
      ? queryPaymentMethodTotals({
          start: bounds.start,
          end: bounds.end,
        })
      : Promise.resolve(
          new Map<AnalyticsPaymentMethod, { orderCount: number; revenueAmount: number }>(),
        ),
    queryShippingMethodTotals({
      start: bounds.start,
      end: bounds.end,
      paymentMethod,
    }),
  ]);

  const paymentBreakdown = buildPaymentBreakdown({
    paymentMethod,
    selectedRange: {
      orderCount: current.orderCount,
      revenueAmount: current.revenueAmount,
    },
    byMethod: paymentTotals,
  });
  const shippingBreakdown = buildShippingBreakdown(shippingTotals);

  return {
    from: input.from,
    to: input.to,
    paymentMethod,
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
    paymentBreakdown,
    shippingBreakdown,
    bestDay: pickBestDay(dailyRows),
    topProducts,
    topCategories,
    todaySoldItems,
  };
}

/** Loads analytics summary with Redis cache (300s TTL). */
export async function getAnalyticsSummary(input: {
  from: string;
  to: string;
  locale?: Locale;
  paymentMethod?: AnalyticsPaymentMethodFilter;
}): Promise<AnalyticsSummary> {
  const locale = input.locale ?? "hy";
  const paymentMethod = input.paymentMethod ?? "all";
  const key = cacheKey(input.from, input.to, locale, paymentMethod);
  const redis = getProviders().redis.getClient();
  const cached = await redis.get(key);

  if (cached) {
    try {
      const parsed = JSON.parse(cached) as AnalyticsSummary;
      if (
        Array.isArray(parsed.paymentBreakdown) &&
        Array.isArray(parsed.shippingBreakdown) &&
        Array.isArray(parsed.todaySoldItems) &&
        parsed.paymentMethod === paymentMethod
      ) {
        return parsed;
      }
      await redis.del(key);
    } catch {
      await redis.del(key);
    }
  }

  const summary = await computeAnalyticsSummary({
    from: input.from,
    to: input.to,
    locale,
    paymentMethod,
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

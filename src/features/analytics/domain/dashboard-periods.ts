import { z } from "zod";

import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import {
  formatAnalyticsMonthLabel,
  formatAnalyticsShortDate,
  rangeForOverviewPeriod,
  type AnalyticsDateRange,
} from "@/features/analytics/domain/date-range";
import {
  appDayStartUtc,
  formatAppIsoDate,
} from "@/lib/datetime/app-timezone";
import { defaultLocale, type Locale } from "@/lib/i18n/config";

export const DASHBOARD_METRIC_PERIODS = [
  "today",
  "week",
  "month",
  "quarter",
] as const;
export type DashboardMetricPeriod = (typeof DASHBOARD_METRIC_PERIODS)[number];

export const DASHBOARD_CHART_RANGES = ["months_6", "year"] as const;
export type DashboardChartRange = (typeof DASHBOARD_CHART_RANGES)[number];

export const dashboardChartRangeSchema = z.enum(DASHBOARD_CHART_RANGES);

export type DashboardTrendPoint = {
  key: string;
  label: string;
  orderCount: number;
  revenueAmount: number;
};

const ANALYTICS_DAILY_SERIES_MAX_DAYS = 45;

function shiftAppMonths(isoDate: string, deltaMonths: number): string {
  const [year, month] = isoDate.split("-").map(Number) as [number, number];
  const totalMonths = year * 12 + (month - 1) + deltaMonths;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

function monthKeyFromIso(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function listMonthKeys(from: string, to: string): string[] {
  const keys: string[] = [];
  let cursor = monthKeyFromIso(from);
  const end = monthKeyFromIso(to);
  while (cursor <= end) {
    keys.push(cursor);
    cursor = monthKeyFromIso(shiftAppMonths(`${cursor}-01`, 1));
  }
  return keys;
}

function listDayKeys(from: string, to: string): string[] {
  const keys: string[] = [];
  let cursor = appDayStartUtc(from);
  const end = appDayStartUtc(to);
  while (cursor.getTime() <= end.getTime()) {
    keys.push(formatAppIsoDate(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return keys;
}

/** Inclusive Yerevan range for a dashboard metric period. */
export function rangeForDashboardMetricPeriod(
  period: DashboardMetricPeriod,
): AnalyticsDateRange {
  return rangeForOverviewPeriod(period);
}

/** Inclusive Yerevan range for the dashboard trend chart. */
export function rangeForDashboardChartRange(
  range: DashboardChartRange,
): AnalyticsDateRange {
  const to = formatAppIsoDate(new Date());
  const monthsBack = range === "months_6" ? 5 : 11;
  return {
    from: shiftAppMonths(to, -monthsBack),
    to,
  };
}

/** Parses dashboard chart range from a query value. */
export function parseDashboardChartRange(
  value: string | undefined,
): DashboardChartRange {
  const parsed = dashboardChartRangeSchema.safeParse(value);
  return parsed.success ? parsed.data : "months_6";
}

/** Inclusive day count for an analytics date range. */
export function countAnalyticsRangeDays(range: AnalyticsDateRange): number {
  const start = appDayStartUtc(range.from);
  const end = appDayStartUtc(range.to);
  return (
    Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
}

function emptyTotals(): { orderCount: number; revenueAmount: number } {
  return { orderCount: 0, revenueAmount: 0 };
}

/** Continuous daily series; missing days stay at zero. */
export function buildAnalyticsDailySeries(
  rows: AnalyticsCsvRow[],
  range: AnalyticsDateRange,
): DashboardTrendPoint[] {
  const byDate = new Map(
    rows.map((row) => [
      row.date,
      { orderCount: row.orderCount, revenueAmount: row.revenueAmount },
    ]),
  );

  return listDayKeys(range.from, range.to).map((key) => {
    const totals = byDate.get(key) ?? emptyTotals();
    return {
      key,
      label: formatAnalyticsShortDate(key),
      orderCount: totals.orderCount,
      revenueAmount: Math.round(totals.revenueAmount * 100) / 100,
    };
  });
}

/** Sparse daily rows summed into calendar months; empty months stay at zero. */
export function buildDashboardMonthlySeries(
  rows: AnalyticsCsvRow[],
  range: AnalyticsDateRange,
  locale: Locale = defaultLocale,
): DashboardTrendPoint[] {
  const totals = new Map<string, { orderCount: number; revenueAmount: number }>();

  for (const row of rows) {
    const key = monthKeyFromIso(row.date);
    const current = totals.get(key) ?? emptyTotals();
    current.orderCount += row.orderCount;
    current.revenueAmount += row.revenueAmount;
    totals.set(key, current);
  }

  return listMonthKeys(range.from, range.to).map((key) => {
    const totalsForMonth = totals.get(key) ?? emptyTotals();
    return {
      key,
      label: formatAnalyticsMonthLabel(key, locale),
      orderCount: totalsForMonth.orderCount,
      revenueAmount: Math.round(totalsForMonth.revenueAmount * 100) / 100,
    };
  });
}

/**
 * Daily points for short ranges; monthly aggregation when the range exceeds 45 days.
 */
export function buildAnalyticsTrendSeries(
  rows: AnalyticsCsvRow[],
  range: AnalyticsDateRange,
  locale: Locale = defaultLocale,
): DashboardTrendPoint[] {
  if (countAnalyticsRangeDays(range) > ANALYTICS_DAILY_SERIES_MAX_DAYS) {
    return buildDashboardMonthlySeries(rows, range, locale);
  }
  return buildAnalyticsDailySeries(rows, range);
}

export type DashboardTrendSummary = {
  orderCount: number;
  revenueAmount: number;
  averageOrderValue: number;
  best: DashboardTrendPoint | null;
};

/** Totals and the highest-revenue point for a trend series. */
export function summarizeTrendPoints(
  points: readonly DashboardTrendPoint[],
): DashboardTrendSummary {
  const orderCount = points.reduce((sum, point) => sum + point.orderCount, 0);
  const revenueAmount = points.reduce(
    (sum, point) => sum + point.revenueAmount,
    0,
  );
  let best: DashboardTrendPoint | null = null;
  for (const point of points) {
    if (point.revenueAmount <= 0) {
      continue;
    }
    if (!best || point.revenueAmount > best.revenueAmount) {
      best = point;
    }
  }
  return {
    orderCount,
    revenueAmount,
    averageOrderValue:
      orderCount === 0
        ? 0
        : Math.round((revenueAmount / orderCount) * 100) / 100,
    best,
  };
}

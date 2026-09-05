import { z } from "zod";

import {
  appDayEndUtc,
  appDayStartUtc,
  formatAppIsoDate,
} from "@/lib/datetime/app-timezone";

const MAX_RANGE_DAYS = 366;

export const ANALYTICS_PERIOD_PRESETS = [
  "last_7_days",
  "last_30_days",
  "last_90_days",
  "this_month",
  "custom",
] as const;

export type AnalyticsPeriodPreset = (typeof ANALYTICS_PERIOD_PRESETS)[number];

export const ANALYTICS_OVERVIEW_PERIODS = [
  "today",
  "week",
  "month",
  "quarter",
] as const;

export type AnalyticsOverviewPeriod = (typeof ANALYTICS_OVERVIEW_PERIODS)[number];

export const analyticsPeriodPresetSchema = z.enum(ANALYTICS_PERIOD_PRESETS);

export const analyticsDateRangeSchema = z
  .object({
    from: z.string().date(),
    to: z.string().date(),
  })
  .refine((value) => value.from <= value.to, {
    message: "from must be on or before to",
  })
  .refine(
    (value) => {
      const start = new Date(`${value.from}T00:00:00.000Z`);
      const end = new Date(`${value.to}T00:00:00.000Z`);
      const days =
        Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) +
        1;
      return days <= MAX_RANGE_DAYS;
    },
    { message: `Date range must be at most ${MAX_RANGE_DAYS} days` },
  );

export type AnalyticsDateRange = z.infer<typeof analyticsDateRangeSchema>;

const PRESET_LABELS: Record<AnalyticsPeriodPreset, string> = {
  last_7_days: "Վերջին 7 օր",
  last_30_days: "Վերջին 30 օր",
  last_90_days: "Վերջին 90 օր",
  this_month: "Այս ամիս",
  custom: "Այլ միջակայք",
};

const OVERVIEW_LABELS: Record<AnalyticsOverviewPeriod, string> = {
  today: "Այսօր",
  week: "Շաբաթ",
  month: "Ամիս",
  quarter: "Եռամսյակ",
};

/** Human label for a period preset select option. */
export function analyticsPeriodLabel(preset: AnalyticsPeriodPreset): string {
  return PRESET_LABELS[preset];
}

/** Human label for overview snapshot cards. */
export function analyticsOverviewLabel(
  period: AnalyticsOverviewPeriod,
): string {
  return OVERVIEW_LABELS[period];
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function appTodayIso(): string {
  return formatAppIsoDate(new Date());
}

function shiftAppIsoDays(isoDate: string, deltaDays: number): string {
  const shifted = new Date(
    appDayStartUtc(isoDate).getTime() + deltaDays * 24 * 60 * 60 * 1000,
  );
  return formatAppIsoDate(shifted);
}

function calendarMonthStart(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

function calendarQuarterStart(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number) as [number, number];
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1;
  return `${year}-${String(quarterStartMonth).padStart(2, "0")}-01`;
}

/** Inclusive Yerevan-day UTC bounds for an ISO from/to range. */
export function analyticsPeriodUtcBounds(
  from: string,
  to: string,
): { start: Date; end: Date } {
  return {
    start: appDayStartUtc(from),
    end: appDayEndUtc(to),
  };
}

/** Current and previous windows of equal length in Yerevan calendar days. */
export function comparableAnalyticsPeriodBounds(
  from: string,
  to: string,
): {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  previousFrom: string;
  previousTo: string;
} {
  const { start, end } = analyticsPeriodUtcBounds(from, to);
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
    previousFrom: formatAppIsoDate(previousStart),
    previousTo: formatAppIsoDate(previousEnd),
  };
}

/** Inclusive Yerevan date range for a named analytics period preset. */
export function rangeForAnalyticsPeriod(
  preset: Exclude<AnalyticsPeriodPreset, "custom">,
): AnalyticsDateRange {
  const to = appTodayIso();

  if (preset === "this_month") {
    return { from: calendarMonthStart(to), to };
  }

  const daysBack =
    preset === "last_7_days" ? 6 : preset === "last_30_days" ? 29 : 89;
  return { from: shiftAppIsoDays(to, -daysBack), to };
}

/** Inclusive Yerevan ranges for dashboard overview cards. */
export function rangeForOverviewPeriod(
  period: AnalyticsOverviewPeriod,
): AnalyticsDateRange {
  const to = appTodayIso();

  if (period === "today") {
    return { from: to, to };
  }
  if (period === "week") {
    return { from: shiftAppIsoDays(to, -6), to };
  }
  if (period === "month") {
    return { from: calendarMonthStart(to), to };
  }
  return { from: calendarQuarterStart(to), to };
}

/** Default inclusive last-7-days range in UTC ISO dates. */
export function defaultAnalyticsDateRange(): AnalyticsDateRange {
  return rangeForAnalyticsPeriod("last_7_days");
}

/** Detects which preset matches an inclusive from/to range. */
export function matchAnalyticsPeriodPreset(
  range: AnalyticsDateRange,
): AnalyticsPeriodPreset {
  for (const preset of [
    "last_7_days",
    "last_30_days",
    "last_90_days",
    "this_month",
  ] as const) {
    const expected = rangeForAnalyticsPeriod(preset);
    if (expected.from === range.from && expected.to === range.to) {
      return preset;
    }
  }
  return "custom";
}

export {
  formatAnalyticsDisplayDate,
  formatAnalyticsMonthLabel,
  formatAnalyticsShortDate,
} from "@/features/analytics/domain/date-labels";

/** Formats percent delta vs a previous numeric value. */
export function formatPeriodDelta(current: number, previous: number): string {
  const pct = periodDeltaPercent(current, previous);
  if (pct === null) {
    return "—";
  }
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** Numeric percent delta; null when both values are zero. */
export function periodDeltaPercent(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    if (current === 0) {
      return null;
    }
    return 100;
  }
  return ((current - previous) / previous) * 100;
}

/** Fills missing calendar days in a from→to window with zero metrics. */
export function fillDailyAnalyticsGaps<
  T extends { date: string; orderCount: number; revenueAmount: number },
>(
  from: string,
  to: string,
  rows: readonly T[],
  createEmpty: (date: string) => T,
): T[] {
  const byDate = new Map(rows.map((row) => [row.date, row]));
  const filled: T[] = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);

  while (cursor <= end) {
    const date = toIsoDate(cursor);
    filled.push(byDate.get(date) ?? createEmpty(date));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return filled;
}

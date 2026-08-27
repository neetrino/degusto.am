import { z } from "zod";

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

function utcToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Inclusive UTC date range for a named analytics period preset. */
export function rangeForAnalyticsPeriod(
  preset: Exclude<AnalyticsPeriodPreset, "custom">,
): AnalyticsDateRange {
  const toDate = utcToday();
  const fromDate = new Date(toDate);

  if (preset === "last_7_days") {
    fromDate.setUTCDate(fromDate.getUTCDate() - 6);
  } else if (preset === "last_30_days") {
    fromDate.setUTCDate(fromDate.getUTCDate() - 29);
  } else if (preset === "last_90_days") {
    fromDate.setUTCDate(fromDate.getUTCDate() - 89);
  } else {
    fromDate.setUTCDate(1);
  }

  return { from: toIsoDate(fromDate), to: toIsoDate(toDate) };
}

/** Inclusive UTC ranges for dashboard overview cards. */
export function rangeForOverviewPeriod(
  period: AnalyticsOverviewPeriod,
): AnalyticsDateRange {
  const toDate = utcToday();
  const fromDate = new Date(toDate);

  if (period === "today") {
    return { from: toIsoDate(toDate), to: toIsoDate(toDate) };
  }
  if (period === "week") {
    fromDate.setUTCDate(fromDate.getUTCDate() - 6);
  } else if (period === "month") {
    fromDate.setUTCDate(1);
  } else {
    fromDate.setUTCDate(fromDate.getUTCDate() - 89);
  }

  return { from: toIsoDate(fromDate), to: toIsoDate(toDate) };
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

const HY_MONTHS_LONG = [
  "հունվար",
  "փետրվար",
  "մարտ",
  "ապրիլ",
  "մայիս",
  "հունիս",
  "հուլիս",
  "օգոստոս",
  "սեպտեմբեր",
  "հոկտեմբեր",
  "նոյեմբեր",
  "դեկտեմբեր",
] as const;

const HY_MONTHS_SHORT = [
  "հնվ",
  "փտվ",
  "մրտ",
  "ապր",
  "մյս",
  "հնս",
  "հլս",
  "օգս",
  "սեպ",
  "հոկ",
  "նոյ",
  "դեկ",
] as const;

function parseUtcIsoDate(isoDate: string): {
  day: number;
  monthIndex: number;
  year: number;
} {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return {
    day: date.getUTCDate(),
    monthIndex: date.getUTCMonth(),
    year: date.getUTCFullYear(),
  };
}

/**
 * Formats an ISO date for analytics headers (deterministic Armenian).
 * Avoids Intl locale hydration mismatches between Node and browser.
 */
export function formatAnalyticsDisplayDate(isoDate: string): string {
  const { day, monthIndex, year } = parseUtcIsoDate(isoDate);
  return `${day} ${HY_MONTHS_LONG[monthIndex]}, ${year}`;
}

/**
 * Formats a short chart/list date (deterministic Armenian).
 * Avoids Intl locale hydration mismatches between Node and browser.
 */
export function formatAnalyticsShortDate(isoDate: string): string {
  const { day, monthIndex } = parseUtcIsoDate(isoDate);
  return `${day} ${HY_MONTHS_SHORT[monthIndex]}`;
}

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

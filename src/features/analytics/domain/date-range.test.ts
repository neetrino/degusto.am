import { describe, expect, it } from "vitest";

import {
  fillDailyAnalyticsGaps,
  formatAnalyticsDisplayDate,
  formatAnalyticsShortDate,
  formatPeriodDelta,
  matchAnalyticsPeriodPreset,
  periodDeltaPercent,
  rangeForAnalyticsPeriod,
  rangeForOverviewPeriod,
} from "@/features/analytics/domain/date-range";

describe("rangeForAnalyticsPeriod", () => {
  it("returns an inclusive last-7-days window", () => {
    const range = rangeForAnalyticsPeriod("last_7_days");
    const start = new Date(`${range.from}T00:00:00.000Z`);
    const end = new Date(`${range.to}T00:00:00.000Z`);
    const days =
      Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    expect(days).toBe(7);
    expect(range.from <= range.to).toBe(true);
  });

  it("matches preset detection for generated ranges", () => {
    const range = rangeForAnalyticsPeriod("last_30_days");
    expect(matchAnalyticsPeriodPreset(range)).toBe("last_30_days");
  });
});

describe("rangeForOverviewPeriod", () => {
  it("returns a single-day window for today", () => {
    const range = rangeForOverviewPeriod("today");
    expect(range.from).toBe(range.to);
  });

  it("returns a 7-day window for week", () => {
    const range = rangeForOverviewPeriod("week");
    const start = new Date(`${range.from}T00:00:00.000Z`);
    const end = new Date(`${range.to}T00:00:00.000Z`);
    const days =
      Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    expect(days).toBe(7);
  });
});

describe("period deltas", () => {
  it("formats and computes percent deltas", () => {
    expect(periodDeltaPercent(110, 100)).toBeCloseTo(10);
    expect(formatPeriodDelta(110, 100)).toBe("+10.0%");
    expect(periodDeltaPercent(0, 0)).toBeNull();
    expect(formatPeriodDelta(0, 0)).toBe("—");
  });
});

describe("fillDailyAnalyticsGaps", () => {
  it("fills missing days with empty rows", () => {
    const filled = fillDailyAnalyticsGaps(
      "2026-01-01",
      "2026-01-03",
      [
        {
          date: "2026-01-02",
          orderCount: 2,
          revenueAmount: 100,
        },
      ],
      (date) => ({ date, orderCount: 0, revenueAmount: 0 }),
    );

    expect(filled).toHaveLength(3);
    expect(filled[0]?.orderCount).toBe(0);
    expect(filled[1]?.orderCount).toBe(2);
    expect(filled[2]?.date).toBe("2026-01-03");
  });
});

describe("deterministic Armenian date formatting", () => {
  it("formats display and short dates without Intl", () => {
    expect(formatAnalyticsDisplayDate("2026-08-21")).toBe("21 օգոստոս, 2026");
    expect(formatAnalyticsShortDate("2026-08-21")).toBe("21 օգս");
  });
});

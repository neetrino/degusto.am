import { describe, expect, it } from "vitest";

import {
  buildAnalyticsTrendSeries,
  buildDashboardMonthlySeries,
  countAnalyticsRangeDays,
  parseDashboardChartRange,
  rangeForDashboardChartRange,
  rangeForDashboardMetricPeriod,
} from "@/features/analytics/domain/dashboard-periods";
import { rangeForOverviewPeriod } from "@/features/analytics/domain/date-range";

describe("dashboard periods", () => {
  it("reuses Yerevan overview ranges for metric cards", () => {
    expect(rangeForDashboardMetricPeriod("today")).toEqual(
      rangeForOverviewPeriod("today"),
    );
    expect(rangeForDashboardMetricPeriod("quarter")).toEqual(
      rangeForOverviewPeriod("quarter"),
    );
  });

  it("starts a calendar quarter on Jan/Apr/Jul/Oct", () => {
    const range = rangeForDashboardMetricPeriod("quarter");
    const month = Number(range.from.slice(5, 7));
    expect([1, 4, 7, 10]).toContain(month);
    expect(range.from.endsWith("-01")).toBe(true);
    expect(range.from <= range.to).toBe(true);
  });

  it("defaults an invalid chart range to 6 months", () => {
    expect(parseDashboardChartRange(undefined)).toBe("months_6");
    expect(parseDashboardChartRange("year")).toBe("year");
    expect(parseDashboardChartRange("nope")).toBe("months_6");
  });

  it("builds a 6-month and 12-month chart window", () => {
    const six = rangeForDashboardChartRange("months_6");
    const year = rangeForDashboardChartRange("year");
    expect(countAnalyticsRangeDays(six)).toBeGreaterThan(150);
    expect(countAnalyticsRangeDays(year)).toBeGreaterThan(330);
  });

  it("aggregates daily rows into months and switches after 45 days", () => {
    const range = { from: "2026-01-01", to: "2026-03-31" };
    const series = buildAnalyticsTrendSeries(
      [
        {
          date: "2026-01-15",
          orderCount: 2,
          revenueAmount: 100,
          averageOrderValue: 50,
        },
        {
          date: "2026-03-02",
          orderCount: 1,
          revenueAmount: 40,
          averageOrderValue: 40,
        },
      ],
      range,
      "en",
    );

    expect(series).toHaveLength(3);
    expect(series[0]).toMatchObject({
      key: "2026-01",
      orderCount: 2,
      revenueAmount: 100,
    });
    expect(series[1]?.orderCount).toBe(0);
    expect(series[2]?.label).toContain("2026");

    const monthly = buildDashboardMonthlySeries(
      [
        {
          date: "2026-01-01",
          orderCount: 1,
          revenueAmount: 10,
          averageOrderValue: 10,
        },
      ],
      { from: "2026-01-01", to: "2026-01-31" },
      "en",
    );
    expect(monthly[0]?.label).toBe("January 2026");
  });
});

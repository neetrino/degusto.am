"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  DASHBOARD_CHART_RANGES,
  type DashboardChartRange,
} from "@/features/analytics/domain/dashboard-periods";

type DashboardChartRangeToggleProps = {
  chart: DashboardChartRange;
  months6Label: string;
  yearLabel: string;
};

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  nextChart: DashboardChartRange,
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("chart", nextChart);
  return `${pathname}?${params.toString()}`;
}

export function DashboardChartRangeToggle({
  chart,
  months6Label,
  yearLabel,
}: DashboardChartRangeToggleProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const labels: Record<DashboardChartRange, string> = {
    months_6: months6Label,
    year: yearLabel,
  };

  return (
    <div className="inline-flex rounded-full border border-[#ead7bf] bg-white/90 p-1 shadow-sm">
      {DASHBOARD_CHART_RANGES.map((option) => {
        const active = option === chart;
        return (
          <Link
            key={option}
            href={buildHref(pathname, searchParams, option)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${
              active
                ? "bg-[#1f3a22] text-white"
                : "text-[#5c564e] hover:bg-[#fff5ed]"
            }`}
          >
            {labels[option]}
          </Link>
        );
      })}
    </div>
  );
}

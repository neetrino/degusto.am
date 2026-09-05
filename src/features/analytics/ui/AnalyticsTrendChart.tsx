"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";

import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import { formatAnalyticsShortDate } from "@/features/analytics/domain/date-range";

const REVENUE_COLOR = "#f55c0a";
const ORDERS_COLOR = "#2f6b4f";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center text-sm text-[#8a837a]">
      Գրաֆիկը բեռնվում է…
    </div>
  ),
});

type AnalyticsTrendChartRow = AnalyticsCsvRow & {
  revenueLabel: string;
  label?: string;
};

type AnalyticsTrendChartProps = {
  rows: AnalyticsTrendChartRow[];
};

/**
 * Dual-area trend: soft revenue wave + orders outline (dual Y-axis).
 */
export function AnalyticsTrendChart({ rows }: AnalyticsTrendChartProps) {
  const categories = useMemo(
    () => rows.map((row) => row.label ?? formatAnalyticsShortDate(row.date)),
    [rows],
  );
  const revenueSeries = useMemo(
    () => rows.map((row) => row.revenueAmount),
    [rows],
  );
  const orderSeries = useMemo(
    () => rows.map((row) => row.orderCount),
    [rows],
  );
  const revenueLabels = useMemo(
    () => rows.map((row) => row.revenueLabel),
    [rows],
  );

  const maxOrders = useMemo(
    () => Math.max(0, ...orderSeries),
    [orderSeries],
  );
  const ordersAxisMax = Math.max(4, Math.ceil(maxOrders * 1.4));

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "area",
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "inherit",
        animations: {
          enabled: true,
          speed: 850,
          animateGradually: { enabled: true, delay: 90 },
          dynamicAnimation: { enabled: true, speed: 320 },
        },
        background: "transparent",
        dropShadow: {
          enabled: true,
          enabledOnSeries: [0],
          top: 10,
          left: 0,
          blur: 14,
          color: REVENUE_COLOR,
          opacity: 0.22,
        },
      },
      colors: [REVENUE_COLOR, ORDERS_COLOR],
      stroke: {
        curve: "smooth",
        width: [3.5, 2.75],
        lineCap: "round",
      },
      fill: {
        type: ["gradient", "gradient"],
        gradient: {
          type: "vertical",
          shadeIntensity: 0.15,
          opacityFrom: 0.55,
          opacityTo: 0.02,
          stops: [0, 78, 100],
          colorStops: [
            [
              { offset: 0, color: "#ff8a3d", opacity: 0.55 },
              { offset: 45, color: "#f66812", opacity: 0.22 },
              { offset: 100, color: "#fff7ef", opacity: 0 },
            ],
            [
              { offset: 0, color: "#2f6b4f", opacity: 0.16 },
              { offset: 100, color: "#ffffff", opacity: 0 },
            ],
          ],
        },
      },
      dataLabels: { enabled: false },
      markers: {
        size: [0, 4.5],
        strokeWidth: 2.5,
        strokeColors: ["#ffffff", "#ffffff"],
        colors: [REVENUE_COLOR, ORDERS_COLOR],
        hover: { size: 7, sizeOffset: 2 },
        discrete: categories.map((_, index) => ({
          seriesIndex: 0,
          dataPointIndex: index,
          fillColor: "#ffffff",
          strokeColor: REVENUE_COLOR,
          size: (revenueSeries[index] ?? 0) > 0 ? 4 : 0,
          shape: "circle" as const,
        })),
      },
      grid: {
        show: true,
        borderColor: "rgba(234, 215, 191, 0.45)",
        strokeDashArray: 0,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 12, left: 6, right: 6, bottom: 0 },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: "#9a9288",
            fontSize: "11px",
            fontWeight: 600,
          },
          hideOverlappingLabels: true,
          offsetY: 4,
        },
        tooltip: { enabled: false },
        crosshairs: {
          show: true,
          width: 1,
          position: "back",
          opacity: 0.7,
          stroke: {
            color: "#f0c9a8",
            width: 1,
            dashArray: 0,
          },
          fill: {
            type: "gradient",
            gradient: {
              colorFrom: "rgba(246, 104, 18, 0.12)",
              colorTo: "rgba(246, 104, 18, 0)",
              stops: [0, 100],
              opacityFrom: 0.35,
              opacityTo: 0.05,
            },
          },
        },
      },
      yaxis: [
        {
          labels: {
            style: { colors: "#b0a79c", fontSize: "10px", fontWeight: 500 },
            formatter: (value) => {
              if (value >= 1000) {
                return `${Math.round(value / 1000)}k`;
              }
              return String(Math.round(value));
            },
            offsetX: -2,
          },
        },
        {
          opposite: true,
          min: 0,
          max: ordersAxisMax,
          tickAmount: 4,
          forceNiceScale: true,
          labels: {
            style: { colors: "#b0a79c", fontSize: "10px", fontWeight: 500 },
            formatter: (value) => String(Math.round(value)),
            offsetX: 2,
          },
        },
      ],
      legend: { show: false },
      states: {
        hover: {
          filter: { type: "none" },
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: { type: "none" },
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        followCursor: true,
        theme: undefined,
        style: { fontSize: "12px", fontFamily: "inherit" },
        cssClass: "degusto-analytics-tooltip",
        x: { show: true },
        y: {
          formatter: (value, opts) => {
            const seriesIndex = opts?.seriesIndex ?? 0;
            const dataPointIndex = opts?.dataPointIndex ?? 0;
            if (seriesIndex === 0) {
              return revenueLabels[dataPointIndex] ?? String(value);
            }
            return `${Math.round(value)} պատվեր`;
          },
        },
        marker: { show: true },
      },
    }),
    [categories, ordersAxisMax, revenueLabels, revenueSeries],
  );

  const series = useMemo(
    () => [
      {
        name: "Եկամուտ",
        type: "area" as const,
        data: revenueSeries,
      },
      {
        name: "Պատվերներ",
        type: "area" as const,
        data: orderSeries,
      },
    ],
    [orderSeries, revenueSeries],
  );

  return (
    <div className="degusto-analytics-chart h-72 w-full sm:h-[22rem]">
      <ReactApexChart
        type="area"
        height="100%"
        width="100%"
        options={options}
        series={series}
      />
    </div>
  );
}

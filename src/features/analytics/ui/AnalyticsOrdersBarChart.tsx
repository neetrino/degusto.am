"use client";

import { useState } from "react";

import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import { formatAnalyticsShortDate } from "@/features/analytics/domain/date-range";

export type AnalyticsOrdersBarChartRow = AnalyticsCsvRow & {
  revenueLabel: string;
};

type AnalyticsOrdersBarChartProps = {
  rows: AnalyticsOrdersBarChartRow[];
};

type BarLayout = {
  row: AnalyticsOrdersBarChartRow;
  x: number;
  y: number;
  barWidth: number;
  barHeight: number;
  radius: number;
};

/** Interactive daily orders bar chart with revenue tooltip on hover. */
export function AnalyticsOrdersBarChart({ rows }: AnalyticsOrdersBarChartProps) {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const width = 640;
  const height = 240;
  const padding = { top: 28, right: 20, bottom: 40, left: 40 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxOrders = Math.max(...rows.map((row) => row.orderCount), 1);
  const yMax = Math.max(2, Math.ceil(maxOrders * 1.15));
  const barGap = 12;
  const barWidth = Math.min(
    48,
    Math.max(18, (plotWidth - barGap * (rows.length - 1)) / rows.length),
  );
  const groupWidth = rows.length * barWidth + (rows.length - 1) * barGap;
  const startX = padding.left + (plotWidth - groupWidth) / 2;
  const yTicks = Array.from({ length: yMax + 1 }, (_, index) => index);

  const bars: BarLayout[] = rows.map((row, index) => {
    const barHeight = Math.max(
      row.orderCount === 0 ? 0 : 10,
      (row.orderCount / yMax) * plotHeight,
    );
    const x = startX + index * (barWidth + barGap);
    const y = padding.top + plotHeight - barHeight;
    const radius = Math.min(8, barWidth / 3);

    return { row, x, y, barWidth, barHeight, radius };
  });

  const hoveredBar = bars.find((bar) => bar.row.date === hoveredDate) ?? null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-60 w-full"
      role="img"
      aria-label="Orders by day bar chart"
    >
      <defs>
        <linearGradient id="ordersBarFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a3d" />
          <stop offset="100%" stopColor="#f55c0a" />
        </linearGradient>
        <linearGradient id="ordersBarGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f55c0a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {yTicks.map((tick) => {
        const y = padding.top + plotHeight - (tick / yMax) * plotHeight;
        return (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#ece7df"
              strokeDasharray="4 6"
            />
            <text
              x={padding.left - 12}
              y={y + 4}
              textAnchor="end"
              className="fill-[#8a837a] text-[11px] font-medium"
            >
              {tick}
            </text>
          </g>
        );
      })}

      {bars.map((bar) => {
        const isHovered = hoveredDate === bar.row.date;
        const hitHeight = Math.max(bar.barHeight, 24);
        const hitY = padding.top + plotHeight - hitHeight;

        return (
          <g key={bar.row.date}>
            {bar.barHeight > 0 ? (
              <>
                <rect
                  x={bar.x - 4}
                  y={bar.y - 6}
                  width={bar.barWidth + 8}
                  height={bar.barHeight + 10}
                  rx={bar.radius + 2}
                  fill="url(#ordersBarGlow)"
                  opacity={isHovered ? 1 : 0.75}
                />
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={bar.barWidth}
                  height={bar.barHeight}
                  rx={bar.radius}
                  fill="url(#ordersBarFill)"
                  opacity={isHovered ? 1 : 0.92}
                />
                <text
                  x={bar.x + bar.barWidth / 2}
                  y={bar.y - 10}
                  textAnchor="middle"
                  className="fill-[#1f1a17] text-[11px] font-semibold"
                >
                  {bar.row.orderCount}
                </text>
              </>
            ) : (
              <rect
                x={bar.x}
                y={padding.top + plotHeight - 4}
                width={bar.barWidth}
                height={4}
                rx={2}
                fill="#e8e2d9"
              />
            )}

            <rect
              x={bar.x - 6}
              y={hitY}
              width={bar.barWidth + 12}
              height={hitHeight + padding.bottom}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredDate(bar.row.date)}
              onMouseLeave={() => setHoveredDate(null)}
              onFocus={() => setHoveredDate(bar.row.date)}
              onBlur={() => setHoveredDate(null)}
              aria-label={`${formatAnalyticsShortDate(bar.row.date)}: ${bar.row.revenueLabel}`}
              role="button"
              tabIndex={0}
            />

            <text
              x={bar.x + bar.barWidth / 2}
              y={height - 12}
              textAnchor="middle"
              className="fill-[#5c564e] text-[11px] font-medium"
            >
              {formatAnalyticsShortDate(bar.row.date)}
            </text>
          </g>
        );
      })}

      {hoveredBar ? (
        <g pointerEvents="none">
          <rect
            x={hoveredBar.x + hoveredBar.barWidth / 2 - 56}
            y={hoveredBar.y - 44}
            width={112}
            height={32}
            rx={10}
            fill="#1f1a17"
            opacity={0.96}
          />
          <text
            x={hoveredBar.x + hoveredBar.barWidth / 2}
            y={hoveredBar.y - 30}
            textAnchor="middle"
            className="fill-[#8a837a] text-[10px] font-medium"
          >
            Revenue
          </text>
          <text
            x={hoveredBar.x + hoveredBar.barWidth / 2}
            y={hoveredBar.y - 16}
            textAnchor="middle"
            className="fill-white text-[12px] font-bold"
          >
            {hoveredBar.row.revenueLabel}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

import { BarChart3, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import { formatAnalyticsShortDate } from "@/features/analytics/domain/date-range";
import { AnalyticsOrdersBarChart } from "@/features/analytics/ui/AnalyticsOrdersBarChart";

type AnalyticsOrdersByDayProps = {
  rows: AnalyticsCsvRow[];
  formatMoney: (amount: number) => string;
};

function formatOrderLabel(count: number): string {
  return count === 1 ? "1 order" : `${count} orders`;
}

export function AnalyticsOrdersByDay({
  rows,
  formatMoney,
}: AnalyticsOrdersByDayProps) {
  const totalOrders = rows.reduce((sum, row) => sum + row.orderCount, 0);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenueAmount, 0);
  const maxOrders = Math.max(...rows.map((row) => row.orderCount), 1);
  const chartRows = rows.map((row) => ({
    ...row,
    revenueLabel: formatMoney(row.revenueAmount),
  }));

  return (
    <Card className="overflow-hidden rounded-2xl border-[#ead7bf]/70 p-0 shadow-sm">
      <div className="border-b border-[#ead7bf]/60 bg-gradient-to-r from-[#fff8f0] via-white to-[#fff8f0] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8a3d] to-[#f55c0a] text-white shadow-[0_10px_24px_-12px_rgba(246,104,18,0.85)]">
              <BarChart3 className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1f1a17]">
                Orders by Day
              </h2>
              <p className="mt-0.5 text-sm text-[#8a837a]">
                Daily order trends and revenue
              </p>
            </div>
          </div>

          {rows.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <div className="rounded-xl border border-orange-100 bg-white px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a837a]">
                  Orders
                </p>
                <p className="text-lg font-bold text-[#f55c0a]">{totalOrders}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a837a]">
                  Revenue
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatMoney(totalRevenue)}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-14 text-center text-sm text-[#8a837a] sm:px-6">
          No orders in this range.
        </p>
      ) : (
        <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
          <div className="rounded-2xl border border-[#ece7df] bg-gradient-to-b from-white to-[#faf8f5] p-4 sm:p-5">
            <AnalyticsOrdersBarChart rows={chartRows} />
          </div>

          <div className="space-y-2.5">
            {rows.map((row) => {
              const widthPct = Math.max(
                6,
                Math.round((row.orderCount / maxOrders) * 100),
              );

              return (
                <div
                  key={row.date}
                  className="grid grid-cols-1 gap-3 rounded-xl border border-[#ece7df] bg-white p-3.5 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center sm:gap-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1f1a17]">
                      {formatAnalyticsShortDate(row.date)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#8a837a]">
                      {formatOrderLabel(row.orderCount)}
                    </p>
                  </div>

                  <div className="relative h-2 overflow-hidden rounded-full bg-[#f1ece4]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#f55c0a]"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8a837a] sm:hidden">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                      Revenue
                    </span>
                    <p className="text-sm font-bold text-[#1f1a17]">
                      {formatMoney(row.revenueAmount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

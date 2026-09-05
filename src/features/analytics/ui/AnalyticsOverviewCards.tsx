import { TrendingDown, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { AnalyticsPeriodSnapshot } from "@/features/analytics/application/queries";
import {
  analyticsOverviewLabel,
  formatPeriodDelta,
  periodDeltaPercent,
  type AnalyticsOverviewPeriod,
} from "@/features/analytics/domain/date-range";

export type AnalyticsOverviewCopy = {
  periods?: Partial<Record<AnalyticsOverviewPeriod, string>>;
  orders: string;
  averageOrder: string;
};

type AnalyticsOverviewCardsProps = {
  snapshots: AnalyticsPeriodSnapshot[];
  formatMoney: (amount: number) => string;
  copy?: AnalyticsOverviewCopy;
};

function DeltaBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const pct = periodDeltaPercent(current, previous);
  const label = formatPeriodDelta(current, previous);
  if (pct === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#f1ece4] px-2 py-0.5 text-[11px] font-semibold text-[#8a837a]">
        {label}
      </span>
    );
  }
  const positive = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        positive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      {positive ? (
        <TrendingUp className="size-3" aria-hidden />
      ) : (
        <TrendingDown className="size-3" aria-hidden />
      )}
      {label}
    </span>
  );
}

/** Four fixed overview cards: today / week / month / quarter. */
export function AnalyticsOverviewCards({
  snapshots,
  formatMoney,
  copy,
}: AnalyticsOverviewCardsProps) {
  const ordersLabel = copy?.orders ?? "Պատվերներ";
  const averageLabel = copy?.averageOrder ?? "Միջին պատվեր";

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {snapshots.map((snapshot) => (
        <Card
          key={snapshot.id}
          className="rounded-2xl border-[#ead7bf]/80 bg-white p-4 shadow-[0_8px_22px_rgba(31,26,23,0.04)]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-bold tracking-[0.12em] text-[#8a837a] uppercase">
              {copy?.periods?.[snapshot.id] ?? analyticsOverviewLabel(snapshot.id)}
            </h2>
            <DeltaBadge
              current={snapshot.revenueAmount}
              previous={snapshot.previousRevenueAmount}
            />
          </div>
          <p className="text-xl font-bold tracking-tight text-[#1f1a17]">
            {formatMoney(snapshot.revenueAmount)}
          </p>
          <div className="mt-3 space-y-1.5 border-t border-[#f0ebe3] pt-3 text-xs text-[#5c564e]">
            <p className="flex items-center justify-between gap-2">
              <span>{ordersLabel}</span>
              <span className="font-semibold text-[#1f1a17]">
                {snapshot.orderCount}
              </span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span>{averageLabel}</span>
              <span className="font-semibold text-[#1f1a17]">
                {formatMoney(snapshot.averageOrderValue)}
              </span>
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
}

import {
  BarChart3,
  ClipboardList,
  DollarSign,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { AnalyticsCsvRow } from "@/features/analytics/domain/csv";
import { AnalyticsTrendChart } from "@/features/analytics/ui/AnalyticsTrendChart";

type TrendChartRow = AnalyticsCsvRow & {
  revenueLabel: string;
};

type AnalyticsTrendPanelProps = {
  rows: TrendChartRow[];
  bestDayLabel: string | null;
  bestDayDetail: string | null;
  orderCountLabel: string;
  revenueLabel: string;
  averageOrderLabel: string;
};

type SummaryTone = "rose" | "amber" | "emerald";

/** Trend section with dual-series chart and side summary. */
export function AnalyticsTrendPanel({
  rows,
  bestDayLabel,
  bestDayDetail,
  orderCountLabel,
  revenueLabel,
  averageOrderLabel,
}: AnalyticsTrendPanelProps) {
  const isEmpty = rows.every(
    (row) => row.orderCount === 0 && row.revenueAmount === 0,
  );

  return (
    <Card className="mb-5 overflow-hidden rounded-2xl border-[#ead7bf]/80 p-0 shadow-[0_12px_32px_-24px_rgba(31,26,23,0.35)]">
      <div className="relative isolate overflow-hidden border-b border-[#ead7bf]/60 px-5 py-4 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,138,61,0.14),transparent_55%),linear-gradient(90deg,#fffaf3_0%,#ffffff_48%,#fff7ef_100%)]"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff8a3d] to-[#f55c0a] text-white shadow-[0_12px_24px_-12px_rgba(246,104,18,0.9)] ring-4 ring-white/70">
              <BarChart3 className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#1f1a17]">
                Օրվա աճ
              </h2>
              <p className="mt-0.5 text-sm text-[#8a837a]">
                Եկամուտ և պատվերներ՝ օր օրի
              </p>
            </div>
          </div>

          {!isEmpty ? (
            <div className="flex flex-wrap items-center gap-2">
              <LegendPill
                swatchClass="h-1 w-4 rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#f55c0a]"
                label="Եկամուտ"
              />
              <LegendPill
                swatchClass="size-2.5 rounded-full border-2 border-[#2f6b4f] bg-white"
                label="Պատվերներ"
              />
            </div>
          ) : null}
        </div>
      </div>

      {isEmpty ? (
        <p className="px-5 py-12 text-center text-sm text-[#8a837a] sm:px-6">
          Այս միջակայքում պատվերներ չկան։
        </p>
      ) : (
        <div className="grid gap-4 bg-[#fffcf8] px-5 py-5 lg:grid-cols-[minmax(0,1fr)_232px] lg:items-stretch sm:px-6 sm:py-6">
          <div className="relative overflow-hidden rounded-[1.35rem] border border-[#ead7bf]/70 bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-4">
            <div
              className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-[#ff8a3d]/[0.07] blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-10 size-44 rounded-full bg-[#183322]/[0.04] blur-2xl"
              aria-hidden
            />
            <div className="relative">
              <AnalyticsTrendChart rows={rows} />
            </div>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 lg:content-start">
            <SummaryTile
              label="Եկամուտ"
              value={revenueLabel}
              tone="rose"
              icon={DollarSign}
            />
            <SummaryTile
              label="Պատվերներ"
              value={orderCountLabel}
              tone="amber"
              icon={ClipboardList}
            />
            <SummaryTile
              label="Միջին պատվեր"
              value={averageOrderLabel}
              tone="emerald"
              icon={ShoppingBag}
            />
            <div className="relative overflow-hidden rounded-2xl border border-[#ff7f20]/30 bg-gradient-to-br from-[#fff7ef] via-[#fff3e8] to-[#ffe8d4] px-3.5 py-3.5 shadow-[0_10px_24px_-18px_rgba(246,104,18,0.55)]">
              <div
                className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-[#ff8a3d]/20 blur-xl"
                aria-hidden
              />
              <div className="relative flex items-start justify-between gap-2">
                <p className="text-[11px] font-bold tracking-[0.12em] text-[#f55c0a] uppercase">
                  Լավագույն օր
                </p>
                <span className="flex size-7 items-center justify-center rounded-lg bg-white/80 text-[#f55c0a] shadow-sm">
                  <Sparkles className="size-3.5" aria-hidden />
                </span>
              </div>
              {bestDayLabel && bestDayDetail ? (
                <>
                  <p className="relative mt-1.5 text-sm font-bold text-[#1f1a17]">
                    {bestDayLabel}
                  </p>
                  <p className="relative mt-0.5 text-xs leading-relaxed text-[#5c564e]">
                    {bestDayDetail}
                  </p>
                </>
              ) : (
                <p className="relative mt-1.5 text-sm text-[#8a837a]">
                  Տվյալներ չկան
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function LegendPill({
  swatchClass,
  label,
}: {
  swatchClass: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ead7bf]/80 bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-[#5c564e] shadow-sm backdrop-blur-sm">
      <span className={`inline-block shrink-0 ${swatchClass}`} aria-hidden />
      {label}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: SummaryTone;
  icon: LucideIcon;
}) {
  const toneClass =
    tone === "rose"
      ? {
          card: "border-rose-100/90 bg-gradient-to-br from-rose-50/90 to-orange-50/70",
          icon: "bg-rose-100 text-rose-600",
          value: "text-rose-800",
        }
      : tone === "amber"
        ? {
            card: "border-amber-100/90 bg-gradient-to-br from-amber-50/90 to-yellow-50/60",
            icon: "bg-amber-100 text-amber-700",
            value: "text-amber-900",
          }
        : {
            card: "border-emerald-100/90 bg-gradient-to-br from-emerald-50/90 to-green-50/60",
            icon: "bg-emerald-100 text-emerald-700",
            value: "text-emerald-800",
          };

  return (
    <div
      className={`rounded-2xl border px-3.5 py-3 shadow-[0_8px_18px_-16px_rgba(31,26,23,0.45)] ${toneClass.card}`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-wide text-[#8a837a] uppercase">
          {label}
        </p>
        <span
          className={`flex size-7 items-center justify-center rounded-lg ${toneClass.icon}`}
        >
          <Icon className="size-3.5" aria-hidden />
        </span>
      </div>
      <p className={`text-base font-bold tracking-tight ${toneClass.value}`}>
        {value}
      </p>
    </div>
  );
}

import { Banknote, CreditCard, Wallet, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { AnalyticsPaymentBreakdownRow } from "@/features/analytics/application/queries";
import {
  ANALYTICS_PAYMENT_METHODS,
  analyticsPaymentMethodFilterLabel,
  type AnalyticsPaymentMethod,
  type AnalyticsPaymentMethodFilter,
} from "@/features/analytics/domain/payment-method-filter";

function isAnalyticsPaymentMethod(
  value: string,
): value is AnalyticsPaymentMethod {
  return (ANALYTICS_PAYMENT_METHODS as readonly string[]).includes(value);
}

type MethodTone = "cash" | "idram" | "arca";

const METHOD_UI: Record<
  AnalyticsPaymentMethod,
  { tone: MethodTone; icon: LucideIcon; hint: string }
> = {
  cash: {
    tone: "cash",
    icon: Banknote,
    hint: "Կանխիկ / COD",
  },
  idram: {
    tone: "idram",
    icon: Wallet,
    hint: "Idram դրամապանակ",
  },
  arca: {
    tone: "arca",
    icon: CreditCard,
    hint: "Arca / քարտ",
  },
};

const TONE_CLASSES: Record<
  MethodTone,
  { card: string; iconWrap: string; value: string; active: string }
> = {
  cash: {
    card: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50",
    iconWrap: "bg-emerald-100 text-emerald-700",
    value: "text-emerald-800",
    active: "ring-2 ring-emerald-400/70 ring-offset-2",
  },
  idram: {
    card: "border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50",
    iconWrap: "bg-sky-100 text-sky-700",
    value: "text-sky-800",
    active: "ring-2 ring-sky-400/70 ring-offset-2",
  },
  arca: {
    card: "border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50",
    iconWrap: "bg-amber-100 text-amber-700",
    value: "text-amber-800",
    active: "ring-2 ring-amber-400/70 ring-offset-2",
  },
};

type AnalyticsPaymentBreakdownProps = {
  rows: AnalyticsPaymentBreakdownRow[];
  activeFilter: AnalyticsPaymentMethodFilter;
  formatMoney: (amount: number) => string;
  hrefForMethod: (method: AnalyticsPaymentMethodFilter) => string;
};

/** Selected-range revenue and order totals split by payment method. */
export function AnalyticsPaymentBreakdown({
  rows,
  activeFilter,
  formatMoney,
  hrefForMethod,
}: AnalyticsPaymentBreakdownProps) {
  return (
    <section className="mb-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-[#8a837a] uppercase">
          Ընտրված միջակայք · վճարումներ
        </h2>
        {activeFilter !== "all" ? (
          <a
            href={hrefForMethod("all")}
            className="text-xs font-semibold text-[#1f3a22] underline-offset-2 hover:underline"
          >
            Ցույց տալ բոլորը
          </a>
        ) : null}
      </div>
      <div
        className={`grid gap-3 ${
          rows.length === 1 ? "max-w-md sm:grid-cols-1" : "sm:grid-cols-3"
        }`}
      >
        {rows.map((row) => {
          if (!isAnalyticsPaymentMethod(row.method)) {
            return null;
          }
          const ui = METHOD_UI[row.method];
          const tone = TONE_CLASSES[ui.tone];
          const Icon = ui.icon;
          const isActive = activeFilter === row.method;
          const card = (
            <Card
              className={`rounded-2xl border p-4 shadow-sm ${tone.card} ${
                isActive ? tone.active : ""
              } ${activeFilter === "all" ? "transition hover:shadow-md" : ""}`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#5c564e]">
                  {analyticsPaymentMethodFilterLabel(row.method)}
                </p>
                <span
                  className={`flex size-9 items-center justify-center rounded-xl ${tone.iconWrap}`}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${tone.value}`}>
                {formatMoney(row.revenueAmount)}
              </p>
              <p className="mt-1 text-sm font-medium text-[#5c564e]">
                {row.orderCount} պատվեր
              </p>
              <p className="mt-1 text-xs text-[#8a837a]">{ui.hint}</p>
            </Card>
          );

          if (activeFilter !== "all") {
            return <div key={row.method}>{card}</div>;
          }

          return (
            <a
              key={row.method}
              href={hrefForMethod(row.method)}
              className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7f20]/50 focus-visible:ring-offset-2"
            >
              {card}
            </a>
          );
        })}
      </div>
    </section>
  );
}

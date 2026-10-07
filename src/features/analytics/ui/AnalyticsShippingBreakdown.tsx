import { Bike, Store, type LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { AnalyticsShippingBreakdownRow } from "@/features/analytics/application/queries";
import {
  analyticsShippingMethodLabel,
  type AnalyticsShippingMethod,
} from "@/features/analytics/domain/shipping-breakdown";
import {
  analyticsPaymentMethodFilterLabel,
  type AnalyticsPaymentMethodFilter,
} from "@/features/analytics/domain/payment-method-filter";

type ShippingTone = "pickup" | "delivery";

const METHOD_UI: Record<
  AnalyticsShippingMethod,
  { tone: ShippingTone; icon: LucideIcon; hint: string }
> = {
  pickup: {
    tone: "pickup",
    icon: Store,
    hint: "Ինքնաառաքում / խանութից",
  },
  delivery: {
    tone: "delivery",
    icon: Bike,
    hint: "Առաքում հասցեով",
  },
};

const TONE_CLASSES: Record<
  ShippingTone,
  { card: string; iconWrap: string; value: string }
> = {
  pickup: {
    card: "border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50",
    iconWrap: "bg-teal-100 text-teal-700",
    value: "text-teal-800",
  },
  delivery: {
    card: "border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50",
    iconWrap: "bg-orange-100 text-orange-700",
    value: "text-orange-800",
  },
};

type AnalyticsShippingBreakdownProps = {
  rows: AnalyticsShippingBreakdownRow[];
  paymentMethod: AnalyticsPaymentMethodFilter;
  formatMoney: (amount: number) => string;
};

/** Selected-range pickup vs delivery totals (respects payment filter). */
export function AnalyticsShippingBreakdown({
  rows,
  paymentMethod,
  formatMoney,
}: AnalyticsShippingBreakdownProps) {
  const scopeHint =
    paymentMethod === "all"
      ? "Ընտրված միջակայք · բոլոր վճարումներ"
      : `Ընտրված միջակայք · ${analyticsPaymentMethodFilterLabel(paymentMethod)}`;

  return (
    <section className="mb-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-[#8a837a] uppercase">
          Pickup / Delivery
        </h2>
        <p className="text-xs font-medium text-[#8a837a]">{scopeHint}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const ui = METHOD_UI[row.method];
          const tone = TONE_CLASSES[ui.tone];
          const Icon = ui.icon;

          return (
            <Card
              key={row.method}
              className={`rounded-2xl border p-4 shadow-sm ${tone.card}`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#5c564e]">
                  {analyticsShippingMethodLabel(row.method)}
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
        })}
      </div>
    </section>
  );
}

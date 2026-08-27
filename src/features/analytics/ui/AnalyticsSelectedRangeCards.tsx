import {
  ClipboardList,
  DollarSign,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/Card";

type MetricTone = "rose" | "amber" | "emerald" | "sky";

type SelectedMetric = {
  label: string;
  value: string;
  hint: string;
  tone: MetricTone;
  icon: LucideIcon;
};

const TONE_CLASSES: Record<
  MetricTone,
  { card: string; iconWrap: string; value: string }
> = {
  rose: {
    card: "border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50",
    iconWrap: "bg-rose-100 text-rose-600",
    value: "text-rose-700",
  },
  amber: {
    card: "border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50",
    iconWrap: "bg-amber-100 text-amber-700",
    value: "text-amber-800",
  },
  emerald: {
    card: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50",
    iconWrap: "bg-emerald-100 text-emerald-700",
    value: "text-emerald-700",
  },
  sky: {
    card: "border-sky-100 bg-gradient-to-br from-sky-50 to-blue-50",
    iconWrap: "bg-sky-100 text-sky-700",
    value: "text-sky-800",
  },
};

type AnalyticsSelectedRangeCardsProps = {
  revenueLabel: string;
  orderCount: number;
  averageOrderLabel: string;
  customerCount: number;
};

/** Selected-range summary strip matching the analytics mock. */
export function AnalyticsSelectedRangeCards({
  revenueLabel,
  orderCount,
  averageOrderLabel,
  customerCount,
}: AnalyticsSelectedRangeCardsProps) {
  const metrics: SelectedMetric[] = [
    {
      label: "Եկամուտ",
      value: revenueLabel,
      hint: "Ընտրված միջակայք",
      tone: "rose",
      icon: DollarSign,
    },
    {
      label: "Պատվերներ",
      value: String(orderCount),
      hint: "Ընդհանուր քանակ",
      tone: "amber",
      icon: ClipboardList,
    },
    {
      label: "Միջին պատվեր",
      value: averageOrderLabel,
      hint: "Մեկ պատվերի միջին",
      tone: "emerald",
      icon: ShoppingBag,
    },
    {
      label: "Հաճախորդներ",
      value: String(customerCount),
      hint: "Եզակի գնորդներ",
      tone: "sky",
      icon: Users,
    },
  ];

  return (
    <section className="mb-5">
      <h2 className="mb-3 text-[11px] font-bold tracking-[0.14em] text-[#8a837a] uppercase">
        Ընտրված միջակայք
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const tone = TONE_CLASSES[metric.tone];
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className={`rounded-2xl border p-4 shadow-sm ${tone.card}`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[#5c564e]">
                  {metric.label}
                </p>
                <span
                  className={`flex size-9 items-center justify-center rounded-xl ${tone.iconWrap}`}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${tone.value}`}>
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-[#8a837a]">{metric.hint}</p>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

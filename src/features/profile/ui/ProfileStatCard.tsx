import type { ReactNode } from "react";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  Package,
} from "lucide-react";

type ProfileStatTone = "orders" | "pending" | "completed" | "spent";

type ProfileStatCardProps = {
  label: string;
  value: string;
  tone?: ProfileStatTone;
};

const TONE_STYLES: Record<
  ProfileStatTone,
  { icon: ReactNode; chip: string }
> = {
  orders: {
    icon: <Package className="size-4" aria-hidden />,
    chip: "bg-brand/15 text-brand",
  },
  pending: {
    icon: <Clock3 className="size-4" aria-hidden />,
    chip: "bg-amber-100 text-amber-700",
  },
  completed: {
    icon: <CheckCircle2 className="size-4" aria-hidden />,
    chip: "bg-emerald-100 text-emerald-700",
  },
  spent: {
    icon: <Banknote className="size-4" aria-hidden />,
    chip: "bg-[#fff0e4] text-brand-strong",
  },
};

export function ProfileStatCard({
  label,
  value,
  tone = "orders",
}: ProfileStatCardProps) {
  const style = TONE_STYLES[tone];

  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-brand/15 bg-white p-5 shadow-[0_14px_40px_-28px_rgba(28,25,23,0.35)] transition-transform duration-300 hover:-translate-y-0.5 sm:p-6">
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-product-ink/50 uppercase sm:text-xs">
          {label}
        </p>
        <span
          className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full ${style.chip}`}
        >
          {style.icon}
        </span>
      </div>
      <p className="relative mt-3 font-display text-2xl font-black tracking-tight text-product-ink sm:mt-4 sm:text-[1.85rem]">
        {value}
      </p>
    </div>
  );
}

import { ArrowRight, ShoppingCart } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";

type CartEmptyStateProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

/** Empty cart — floating icon, soft rings, animated CTA. */
export function CartEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: CartEmptyStateProps) {
  return (
    <div className="cart-enter relative overflow-hidden rounded-[32px] border border-[#ff7f20]/15 bg-gradient-to-b from-[#fff8f1] via-white to-white px-6 py-16 text-center shadow-[0_18px_50px_rgba(255,127,32,0.08)]">
      <div
        className="pointer-events-none absolute -top-16 -left-10 size-48 rounded-full bg-[#ff7f20]/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-12 -bottom-20 size-56 rounded-full bg-[#3e573d]/10 blur-2xl"
        aria-hidden
      />

      <div className="relative mx-auto flex size-28 items-center justify-center">
        <span
          className="cart-soft-pulse absolute inset-0 rounded-full bg-[#ff7f20]/15"
          aria-hidden
        />
        <span
          className="cart-float relative flex size-[5.5rem] items-center justify-center rounded-full bg-white text-[#ff7f20] shadow-[0_12px_30px_rgba(255,127,32,0.22)]"
          aria-hidden
        >
          <ShoppingCart className="size-11" strokeWidth={1.75} />
        </span>
      </div>

      <h2 className="cart-enter cart-enter-delay-1 relative mt-7 text-2xl font-bold text-[#3c2f2f] sm:text-[1.75rem]">
        {title}
      </h2>
      <p className="cart-enter cart-enter-delay-2 relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#717182] sm:text-base">
        {description}
      </p>

      <AppLink
        href={ctaHref}
        prefetchPolicy="intent"
        className="cart-enter cart-enter-delay-3 cart-cta-shine group relative mt-8 inline-flex min-h-12 min-w-[14rem] items-center overflow-hidden rounded-full bg-[#ff7f20] py-1.5 pr-1.5 pl-6 text-base font-semibold text-white shadow-[0_10px_28px_rgba(255,127,32,0.35)] transition-[transform,box-shadow,filter] duration-300 hover:-translate-y-0.5 hover:brightness-[1.03] hover:shadow-[0_16px_36px_rgba(255,127,32,0.42)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7f20] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center pr-10 pl-4">
          {ctaLabel}
        </span>
        <span className="relative ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5">
          <ArrowRight className="size-4" aria-hidden />
        </span>
      </AppLink>
    </div>
  );
}

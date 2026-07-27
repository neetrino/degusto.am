import { SearchX } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";

type ShopEmptyStateProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

/** Centered empty catalog state with clear-filters CTA. */
export function ShopEmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: ShopEmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] bg-[#f7f7f8] px-6 py-16 text-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
        <SearchX className="h-8 w-8 text-[#ff7f20]" strokeWidth={1.75} aria-hidden />
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight text-[#1a1a1a]">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-base leading-relaxed text-[#717182]">
        {description}
      </p>
      <AppLink
        href={ctaHref}
        prefetchPolicy="intent"
        className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#ff7f20] px-8 text-base font-semibold text-white transition-colors hover:bg-[#f07018]"
      >
        {ctaLabel}
      </AppLink>
    </div>
  );
}

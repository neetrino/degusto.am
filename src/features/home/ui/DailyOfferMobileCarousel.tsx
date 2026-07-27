"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";

type DailyOfferItem = {
  id: string;
  href: string;
  title: string;
  priceFormatted: string;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
};

type DailyOfferMobileCarouselProps = {
  offers: readonly DailyOfferItem[];
  dailyOfferLabel: string;
  addToCartLabel: string;
};

/** Mobile daily-offer strip — split orange/image cards with page dots. */
export function DailyOfferMobileCarousel({
  offers,
  dailyOfferLabel,
  addToCartLabel,
}: DailyOfferMobileCarouselProps) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (offers.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setPage((current) => (current + 1) % offers.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [offers.length]);

  if (offers.length === 0) {
    return null;
  }

  const active = offers[page] ?? offers[0];
  if (!active) {
    return null;
  }

  return (
    <div className="mt-6">
      <article className="relative mx-auto h-[132px] w-full max-w-[360px] overflow-hidden rounded-[20px]">
        <AppLink
          href={active.href}
          prefetchPolicy="intent"
          className="absolute inset-0 z-[1]"
          aria-label={active.title}
        />
        <div className="absolute inset-y-0 left-0 w-[48%] bg-brand" />
        <div className="absolute inset-y-0 right-0 w-[52%] bg-gray-200">
          {active.imageUrl ? (
            <Image
              src={active.imageUrl}
              alt={active.title}
              fill
              sizes="200px"
              className="object-cover"
            />
          ) : null}
        </div>

        <h3 className="absolute top-2.5 left-[11px] z-[2] whitespace-pre-line text-[20px] font-bold leading-[21px] text-white">
          {dailyOfferLabel}
        </h3>
        <p className="absolute top-[57px] left-[11px] z-[2] w-[102px] line-clamp-2 text-sm leading-[1.15] font-medium text-white/90">
          {active.title}
        </p>
        <p className="absolute top-24 left-[11px] z-[2] text-base leading-none font-black text-white">
          {active.priceFormatted}
        </p>

        {active.discountPercent != null ? (
          <span className="absolute top-[15px] right-2.5 z-[2] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-white text-xs font-bold text-black">
            -{active.discountPercent}%
          </span>
        ) : null}

        <AddToCartButton
          productId={active.id}
          label={addToCartLabel}
          disabled={!active.inStock}
          className="absolute top-[76px] left-[35.95%] z-10 h-[42px] w-[41px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-translate-y-1.5 active:scale-95 motion-reduce:transition-none"
        />
      </article>

      {offers.length > 1 ? (
        <div className="mt-[19px] flex items-center justify-center gap-1 px-3">
          {offers.map((offer, index) => (
            <button
              key={offer.id}
              type="button"
              aria-label={`Go to daily offer page ${index + 1}`}
              aria-current={index === page}
              className={
                index === page
                  ? "h-1 w-5 rounded-[12px] bg-brand transition-colors"
                  : "h-1 w-5 rounded-[12px] bg-[#ffeacc] transition-colors"
              }
              onClick={() => setPage(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

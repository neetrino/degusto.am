"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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

const DAILY_OFFER_CART_ICON = "/assets/mobile/daily-offer-cart.webp";

/**
 * Home mobile daily-offer strip — horizontal snap swipe with page dots.
 */
export function DailyOfferMobileCarousel({
  offers,
  dailyOfferLabel,
  addToCartLabel,
}: DailyOfferMobileCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || offers.length <= 1) {
      return;
    }

    function onScroll(): void {
      if (!el) {
        return;
      }
      const slideWidth = el.clientWidth;
      if (slideWidth <= 0) {
        return;
      }
      setPage(Math.round(el.scrollLeft / slideWidth));
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [offers.length]);

  function goToPage(index: number): void {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  if (offers.length === 0) {
    return null;
  }

  const labelLines = dailyOfferLabel.includes(" ")
    ? dailyOfferLabel.replace(/\s+/, "\n")
    : dailyOfferLabel;

  return (
    <div className="mt-6">
      <div
        ref={scrollerRef}
        className="snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex items-start">
          {offers.map((offer) => (
            <div key={offer.id} className="w-full shrink-0 snap-start px-3">
              <article
                data-mobile-daily-offer
                className="relative h-32 w-full max-w-full cursor-pointer overflow-hidden rounded-[20px]"
              >
                <AppLink
                  href={offer.href}
                  prefetchPolicy="intent"
                  aria-label={offer.title}
                  className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66913]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-[#FF7A00] to-[#F3C4A5]"
                  aria-hidden
                />
                <div className="absolute top-0 left-[49.44%] h-full w-[51.69%] overflow-hidden">
                  {offer.imageUrl ? (
                    <Image
                      src={offer.imageUrl}
                      alt={offer.title}
                      fill
                      sizes="50vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <h3 className="absolute top-2.5 left-[11px] z-[2] whitespace-pre-line text-[20px] leading-[21px] font-bold text-white">
                  {labelLines}
                </h3>
                <p className="absolute top-[57px] left-[11px] z-[2] w-[102px] line-clamp-2 text-sm leading-[1.15] font-medium text-white/90">
                  {offer.title}
                </p>
                <p className="absolute top-24 left-[11px] z-[2] text-base leading-none font-black text-white">
                  {offer.priceFormatted}
                </p>

                {offer.discountPercent != null ? (
                  <span className="absolute top-[15px] right-2.5 z-[2] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-white text-xs font-bold text-black">
                    -{offer.discountPercent}%
                  </span>
                ) : null}

                <AddToCartButton
                  productId={offer.id}
                  label={addToCartLabel}
                  disabled={!offer.inStock}
                  iconSrc={DAILY_OFFER_CART_ICON}
                  iconWidth={42}
                  iconHeight={42}
                  className="absolute top-[76px] left-[35.95%] z-10 h-[42px] w-[41px]"
                />
              </article>
            </div>
          ))}
        </div>
      </div>

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
                  ? "h-1 w-5 rounded-[12px] bg-[#ff7f20] transition-colors"
                  : "h-1 w-5 rounded-[12px] bg-[#ffeacc] transition-colors"
              }
              onClick={() => goToPage(index)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

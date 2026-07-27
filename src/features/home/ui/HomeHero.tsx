"use client";

import { useEffect, useState } from "react";

import { DailyOfferHeroCard } from "@/features/home/ui/DailyOfferHeroCard";
import type { StorefrontHeroSlide } from "@/features/hero/application/queries";
import type { Locale } from "@/lib/i18n/config";

/** Live degusto-am hero composite (burger + DEGUSTO type + green ribbons). */
const HERO_FALLBACK_IMAGE = "/assets/home/hero-visual.webp";

type DailyOfferProduct = {
  id: string;
  href: string;
  title: string;
  priceFormatted: string;
  imageUrl: string | null;
  inStock: boolean;
  categoryLabel?: string | null;
  rating?: number | null;
};

type HomeHeroProps = {
  slides: StorefrontHeroSlide[];
  fallbackTitle: string;
  locale: Locale;
  addToCartLabel: string;
  dailyOfferLabel: string;
  dailyOffer: DailyOfferProduct | null;
};

export function HomeHero({
  slides,
  fallbackTitle,
  addToCartLabel,
  dailyOfferLabel,
  dailyOffer,
}: HomeHeroProps) {
  const [index, setIndex] = useState(0);
  const hasSlides = slides.length > 0;
  const active = hasSlides ? slides[index] : null;

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  const title = active?.copy.title ?? fallbackTitle;
  // Brand composite matches live degusto-am; admin slide URLs may be incomplete art.
  const desktopImage = HERO_FALLBACK_IMAGE;
  const mobileImage = HERO_FALLBACK_IMAGE;

  return (
    <section className="relative left-1/2 right-1/2 hidden w-screen -ml-[50vw] -mr-[50vw] overflow-x-clip bg-[var(--project-color)] pt-8 pb-56 lg:block lg:min-h-[680px] lg:overflow-y-visible lg:pt-8 lg:pb-0 xl:min-h-[780px] 2xl:min-h-[930px]">
      <h1 className="sr-only">{title}</h1>

      <div className="pointer-events-none absolute inset-x-0 top-[68px] z-0 h-[900px] w-full lg:h-full">
        <div className="relative h-full w-full">
          <picture>
            {mobileImage !== desktopImage ? (
              <source media="(max-width: 767px)" srcSet={mobileImage} />
            ) : null}
            {/* Decorative LCP plane — accessible name is in the sr-only heading. */}
            <img
              src={desktopImage}
              alt=""
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-contain object-top"
              aria-hidden
            />
          </picture>
        </div>
      </div>

      {/* Live degusto-am green stroke ribbons (#3E573D). */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="725"
        height="450"
        viewBox="0 0 725 450"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute top-[-200px] left-0 z-[1] h-[1512.29px] w-[678.855px] origin-top-left scale-[0.52] rotate-[20deg] opacity-100 xl:top-[-340px] xl:left-[-72px] xl:scale-[0.68] 2xl:top-[-450px] 2xl:left-[-120px] 2xl:scale-100"
      >
        <path
          d="M-387.936 202.028C-387.936 202.028 119.69 546.315 464.803 275C809.917 3.68502 577.568 -962.001 577.568 -962.001"
          stroke="#3E573D"
          strokeWidth="141"
          strokeLinecap="square"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="211"
        height="985"
        viewBox="0 0 211 985"
        fill="none"
        aria-hidden
        className="pointer-events-none absolute top-[-1px] right-[-96px] z-[1] h-[979.275px] w-[611.208px] origin-top-right scale-[0.52] rotate-[2deg] opacity-100 xl:right-[-130px] xl:scale-[0.68] 2xl:right-[-170px] 2xl:scale-100"
      >
        <path
          d="M537.749 -25.8738C537.749 -25.8738 56.6915 174.312 70.8068 462.466C84.9222 750.619 850.632 902.127 850.632 902.127"
          stroke="#3E573D"
          strokeWidth="141"
          strokeLinecap="square"
        />
      </svg>

      {dailyOffer ? (
        <div className="relative z-20 mx-auto mt-[126px] w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:mt-[134px] md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
          <DailyOfferHeroCard
            href={dailyOffer.href}
            title={dailyOffer.title}
            priceFormatted={dailyOffer.priceFormatted}
            imageUrl={dailyOffer.imageUrl}
            inStock={dailyOffer.inStock}
            productId={dailyOffer.id}
            addToCartLabel={addToCartLabel}
            dailyOfferLabel={dailyOfferLabel}
            categoryLabel={dailyOffer.categoryLabel}
            rating={dailyOffer.rating}
            isVegetarian
          />
        </div>
      ) : null}

      {slides.length > 1 ? (
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${slideIndex + 1}`}
              aria-current={slideIndex === index}
              className={
                slideIndex === index
                  ? "h-2.5 w-8 rounded-full bg-white"
                  : "h-2.5 w-2.5 rounded-full bg-white/50"
              }
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

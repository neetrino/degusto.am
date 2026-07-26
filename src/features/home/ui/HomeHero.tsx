"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { ProductCard } from "@/features/products/ui/ProductCard";
import type { StorefrontHeroSlide } from "@/features/hero/application/queries";
import type { Locale } from "@/lib/i18n/config";

const HERO_FALLBACK_IMAGE = "/assets/home/hero-visual.webp";
const HERO_RIBBON_LEFT = "/assets/home/hero-ribbon-left.svg";
const HERO_RIBBON_RIGHT = "/assets/home/hero-ribbon-right.svg";
const DAILY_OFFER_STAR = "/assets/home/daily-offer-star.svg";

/** Figma Home 1 frame width — ribbon x positions are absolute in this space. */
const FIGMA_FRAME_WIDTH = 1440;
/** Top of hero art (node 1:624) in the Home 1 frame. */
const FIGMA_HERO_TOP = 111;
/** Hero art height (node 1:624). */
const FIGMA_HERO_HEIGHT = 807;

/** Right C-curve — Figma node 1:988. */
const RIBBON_RIGHT = {
  x: 1196,
  y: 160.295,
  width: 884.443,
  height: 1120.421,
  inset: "-7.75% -15.7% -9.8% -11.54%",
} as const;

/** Lower swoosh — Figma node 1:625. */
const RIBBON_LEFT = {
  x: 151.916,
  y: 656.998,
  width: 1523.484,
  height: 1618.999,
  inset: "-5.12% -13.73% -6.52% -9.82%",
} as const;

function figmaRibbonStyle(ribbon: {
  x: number;
  y: number;
  width: number;
  height: number;
}): { left: string; top: string; width: string; height: string } {
  return {
    left: `${(ribbon.x / FIGMA_FRAME_WIDTH) * 100}%`,
    top: `${((ribbon.y - FIGMA_HERO_TOP) / FIGMA_HERO_HEIGHT) * 100}%`,
    width: `${(ribbon.width / FIGMA_FRAME_WIDTH) * 100}%`,
    height: `${(ribbon.height / FIGMA_HERO_HEIGHT) * 100}%`,
  };
}


type DailyOfferProduct = {
  id: string;
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist?: boolean;
  categoryLabel?: string | null;
  rating?: number | null;
  isSpicy?: boolean;
  isVegetarian?: boolean;
};

type HomeHeroProps = {
  slides: StorefrontHeroSlide[];
  fallbackTitle: string;
  locale: Locale;
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  dailyOfferLabel: string;
  isSignedIn: boolean;
  dailyOffer: DailyOfferProduct | null;
};

export function HomeHero({
  slides,
  fallbackTitle,
  locale,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  dailyOfferLabel,
  isSignedIn,
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
  const desktopImage =
    active?.desktopImageUrl ?? active?.mobileImageUrl ?? HERO_FALLBACK_IMAGE;
  const mobileImage =
    active?.mobileImageUrl ?? active?.desktopImageUrl ?? HERO_FALLBACK_IMAGE;
  const showFigmaRibbons =
    desktopImage === HERO_FALLBACK_IMAGE ||
    mobileImage === HERO_FALLBACK_IMAGE;

  return (
    <section
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-[480px] w-screen overflow-hidden bg-brand sm:min-h-[560px]"
      style={{ aspectRatio: "1434 / 807" }}
    >
      <h1 className="sr-only">{title}</h1>

      <div className="absolute inset-0 z-0">
        {/*
          Serve the hero art directly (not via /_next/image). The composite PNG is
          large and the optimizer can hang or stall on mobile device emulation.
        */}
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
            className="absolute inset-0 h-full w-full object-cover object-center"
            aria-hidden
          />
        </picture>
      </div>

      {showFigmaRibbons ? (
        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
          <div className="absolute" style={figmaRibbonStyle(RIBBON_RIGHT)}>
            <div className="absolute" style={{ inset: RIBBON_RIGHT.inset }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative SVG sized to Figma node */}
              <img
                src={HERO_RIBBON_RIGHT}
                alt=""
                className="block size-full max-w-none"
              />
            </div>
          </div>
          <div className="absolute" style={figmaRibbonStyle(RIBBON_LEFT)}>
            <div className="absolute" style={{ inset: RIBBON_LEFT.inset }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- decorative SVG sized to Figma node */}
              <img
                src={HERO_RIBBON_LEFT}
                alt=""
                className="block size-full max-w-none"
              />
            </div>
          </div>
        </div>
      ) : null}

      {dailyOffer ? (
        <div className="absolute top-[12%] left-4 z-20 sm:left-8 md:left-[110px] md:top-[164px]">
          <div className="relative">
            <div className="absolute -top-10 -right-8 z-30 flex size-[100px] items-center justify-center sm:size-[120px] md:-top-10 md:-right-16 md:size-[140px]">
              <Image
                src={DAILY_OFFER_STAR}
                alt=""
                width={140}
                height={140}
                className="absolute inset-0 size-full"
                aria-hidden
              />
              <p className="relative z-10 max-w-[77px] text-center text-xs font-bold leading-[17px] text-white md:text-sm">
                {dailyOfferLabel}
              </p>
            </div>
            <ProductCard
              href={dailyOffer.href}
              title={dailyOffer.title}
              priceFormatted={dailyOffer.priceFormatted}
              compareAtFormatted={null}
              discountPercent={dailyOffer.discountPercent}
              imageUrl={dailyOffer.imageUrl}
              inStock={dailyOffer.inStock}
              priority
              locale={locale}
              productId={dailyOffer.id}
              inWishlist={dailyOffer.inWishlist ?? false}
              isSignedIn={isSignedIn}
              wishlistLabel={wishlistLabel}
              addToCartLabel={addToCartLabel}
              outOfStockLabel={outOfStockLabel}
              categoryLabel={dailyOffer.categoryLabel}
              rating={dailyOffer.rating}
              isSpicy={dailyOffer.isSpicy}
              isVegetarian={dailyOffer.isVegetarian}
              showWishlist={false}
            />
          </div>
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

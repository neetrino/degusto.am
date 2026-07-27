"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { CatalogProductCard } from "@/features/products/ui/shop/CatalogProductCard";
import type { Locale } from "@/lib/i18n/config";

type RelatedCard = {
  id: string;
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted: string | null;
  discountPercent: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist: boolean;
  categoryLabel: string | null;
};

type ProductRelatedCarouselProps = {
  locale: Locale;
  title: string;
  viewMoreLabel: string;
  viewMoreHref: string;
  isSignedIn: boolean;
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  cards: RelatedCard[];
};

/** Dark “try also” related products band with horizontal scroll. */
export function ProductRelatedCarousel({
  locale,
  title,
  viewMoreLabel,
  viewMoreHref,
  isSignedIn,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  cards,
}: ProductRelatedCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: -1 | 1): void {
    const node = scrollerRef.current;
    if (!node) return;
    const amount = Math.min(320, node.clientWidth * 0.8) * direction;
    node.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 rounded-none bg-surface-dark px-4 pt-10 pb-12 text-white sm:px-8 sm:pt-12 sm:pb-14 lg:rounded-[40px] lg:px-12 lg:pt-[4.8rem] lg:pb-16">
      <div className="mx-auto flex w-full max-w-[91.875rem] flex-col gap-8">
        <div className="mb-0 flex flex-wrap items-end justify-between gap-4 lg:mb-2">
          <h2 className="max-w-[min(100%,42rem)] font-display text-4xl leading-none font-black tracking-tight text-white uppercase md:text-5xl lg:text-[3.75rem]">
            {title}
          </h2>
          <AppLink
            href={viewMoreHref}
            prefetchPolicy="intent"
            className="inline-flex h-14 items-center justify-center rounded-full bg-[#ff7f20] px-6 text-base font-bold text-white transition hover:brightness-95"
          >
            {viewMoreLabel} →
          </AppLink>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Previous"
            onClick={() => scrollByCard(-1)}
            className="absolute top-1/2 left-0 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-product-ink shadow-md transition hover:bg-white lg:flex"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => scrollByCard(1)}
            className="absolute top-1/2 right-0 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-product-ink shadow-md transition hover:bg-white lg:flex"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto pt-1 pb-12 [scrollbar-width:none] lg:gap-[30px] lg:px-12 lg:pb-14 [&::-webkit-scrollbar]:hidden"
          >
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="mb-2 w-[min(100%,260px)] shrink-0 sm:w-[240px]"
              >
                <CatalogProductCard
                  href={card.href}
                  title={card.title}
                  priceFormatted={card.priceFormatted}
                  compareAtFormatted={card.compareAtFormatted}
                  discountPercent={card.discountPercent}
                  imageUrl={card.imageUrl}
                  inStock={card.inStock}
                  priority={index < 3}
                  locale={locale}
                  productId={card.id}
                  inWishlist={card.inWishlist}
                  isSignedIn={isSignedIn}
                  wishlistLabel={wishlistLabel}
                  addToCartLabel={addToCartLabel}
                  outOfStockLabel={outOfStockLabel}
                  categoryLabel={card.categoryLabel}
                  rating={5}
                  isSpicy
                  isVegetarian
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

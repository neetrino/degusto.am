"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  PRODUCT_EASE,
  productCardItem,
  productCardStagger,
} from "@/features/products/ui/ProductDetailMotion";
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

function splitAccentTitle(title: string): { lead: string; rest: string } {
  const trimmed = title.trim();
  const spaceIndex = trimmed.indexOf(" ");
  if (spaceIndex === -1) {
    return { lead: trimmed, rest: "" };
  }
  return {
    lead: trimmed.slice(0, spaceIndex),
    rest: trimmed.slice(spaceIndex + 1),
  };
}

/** Dark “try also” related products band with Motion + horizontal scroll. */
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
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 28,
    mass: 0.45,
  });
  const bandY = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [40, 0, -24],
  );
  const glowX = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["-12%", "12%"],
  );

  function scrollByCard(direction: -1 | 1): void {
    const node = scrollerRef.current;
    if (!node) return;
    const item = node.querySelector<HTMLElement>("[data-carousel-item]");
    const styles = window.getComputedStyle(node);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 16;
    const amount = ((item?.offsetWidth ?? 280) + gap) * direction;
    node.scrollBy({ left: amount, behavior: "smooth" });
  }

  const { lead, rest } = splitAccentTitle(title);

  return (
    <motion.section
      ref={sectionRef}
      style={{ y: bandY }}
      className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden rounded-none bg-surface-dark px-4 pt-10 pb-12 text-white will-change-transform sm:px-8 sm:pt-12 sm:pb-14 lg:rounded-[40px] lg:px-12 lg:pt-[4.8rem] lg:pb-16"
    >
      <motion.div
        aria-hidden
        style={{ x: glowX }}
        className="pointer-events-none absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-brand/25 blur-3xl"
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 h-48 w-48 translate-x-1/3 translate-y-1/3 rounded-full bg-[#3E573D]/40 blur-3xl"
      />

      <div className="relative mx-auto flex w-full max-w-[91.875rem] flex-col gap-8">
        <div className="mb-0 flex flex-wrap items-end justify-between gap-4 lg:mb-2">
          <motion.h2
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 28, filter: "blur(10px)" }
            }
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.85, ease: PRODUCT_EASE }}
            className="max-w-[min(100%,42rem)] font-display text-4xl leading-none font-black tracking-tight text-white uppercase md:text-5xl lg:text-[3.75rem]"
          >
            <span className="text-brand-headline">{lead}</span>
            {rest ? ` ${rest}` : null}
          </motion.h2>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: PRODUCT_EASE, delay: 0.12 }}
          >
            <AppLink
              href={viewMoreHref}
              prefetchPolicy="intent"
              className="inline-flex h-14 items-center justify-center rounded-full bg-[#ff7f20] px-6 text-base font-bold text-white transition hover:brightness-95"
            >
              {viewMoreLabel} →
            </AppLink>
          </motion.div>
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

          <div className="overflow-hidden lg:mx-14">
            <motion.div
              ref={scrollerRef}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={reduceMotion ? undefined : productCardStagger}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pt-1 pb-12 [scrollbar-width:none] lg:gap-[30px] lg:pb-14 [&::-webkit-scrollbar]:hidden"
            >
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  data-carousel-item
                  variants={reduceMotion ? undefined : productCardItem}
                  className="mb-2 w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-120px)/5)]"
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
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

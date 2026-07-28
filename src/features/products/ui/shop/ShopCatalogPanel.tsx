"use client";

import { Suspense, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

import { AppLink } from "@/components/ui/AppLink";
import { ShopCatalogFilters } from "@/features/products/ui/shop/ShopCatalogFilters";
import { ShopCatalogProductGrids } from "@/features/products/ui/shop/ShopCatalogProductGrids";
import { ShopEmptyState } from "@/features/products/ui/shop/ShopEmptyState";
import { ShopPagination } from "@/features/products/ui/shop/ShopPagination";
import { buildCatalogHref } from "@/features/products/ui/shop/build-catalog-href";
import { SHOP_EASE } from "@/features/products/ui/shop/ShopProductGridMotion";
import type { Locale } from "@/lib/i18n/config";

type CatalogCard = {
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
  isSpicy?: boolean;
  isVegetarian?: boolean;
};

type ShopCatalogPanelProps = {
  locale: Locale;
  menuTitle: string;
  menuSubtitle: string;
  selectCategoriesLabel: string;
  categoriesPickerHref: string;
  showSelectCategories: boolean;
  priceLabel: string;
  priceFromLabel: string;
  priceToLabel: string;
  dietFilterLabel: string;
  dietNoneLabel: string;
  dietVegetarianLabel: string;
  dietSpicyLabel: string;
  minPrice: string;
  maxPrice: string;
  diet: "none" | "veg" | "spicy";
  filterKey: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
  products: readonly CatalogCard[];
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  rating: number;
  isSignedIn: boolean;
  paginationLabel: string;
  previousLabel: string;
  nextLabel: string;
  currentPage: number;
  totalPages: number;
  paginationLocale: string;
  paginationCategory?: string;
  paginationMin?: string;
  paginationMax?: string;
  paginationQuery?: string;
  paginationDiet?: string;
};

/**
 * Shared shop catalog body — Motion title/filters/grid + scroll float.
 * Mobile uses compact home tiles to match live degusto-am category menu.
 */
export function ShopCatalogPanel({
  locale,
  menuTitle,
  menuSubtitle,
  selectCategoriesLabel,
  categoriesPickerHref,
  showSelectCategories,
  priceLabel,
  priceFromLabel,
  priceToLabel,
  dietFilterLabel,
  dietNoneLabel,
  dietVegetarianLabel,
  dietSpicyLabel,
  minPrice,
  maxPrice,
  diet,
  filterKey,
  emptyTitle,
  emptyDescription,
  emptyCtaLabel,
  emptyCtaHref,
  products,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  rating,
  isSignedIn,
  paginationLabel,
  previousLabel,
  nextLabel,
  currentPage,
  totalPages,
  paginationLocale,
  paginationCategory,
  paginationMin,
  paginationMax,
  paginationQuery,
  paginationDiet,
}: ShopCatalogPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();

  function buildPageHref(nextPage: number): string {
    return buildCatalogHref(paginationLocale, {
      category: paginationCategory,
      page: nextPage,
      min: paginationMin,
      max: paginationMax,
      q: paginationQuery,
      diet: paginationDiet,
    });
  }

  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ["start end", "end start"],
  });
  const panelProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 28,
    mass: 0.45,
  });
  const headerY = useTransform(
    panelProgress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["6%", "-4%"],
  );

  return (
    <section ref={panelRef} className="relative min-w-0 flex-1 overflow-hidden">
      <motion.div
        style={{ y: headerY }}
        className="relative mb-[42px] mt-2 flex flex-col gap-6 xl:mt-0 xl:flex-row xl:items-start xl:justify-between lg:mt-0"
      >
        <motion.div
          initial={
            reduceMotion
              ? false
              : { opacity: 0, y: 36, filter: "blur(12px)" }
          }
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.85, ease: SHOP_EASE }}
          className="min-w-0 max-w-xl"
        >
          <h1 className="text-[32px] leading-tight font-bold text-brand-headline lg:text-4xl xl:text-[60px] xl:leading-[51px]">
            {menuTitle}
          </h1>
          <p className="mt-2 text-sm tracking-[-0.2px] text-[#717182] lg:mt-3 lg:text-base lg:tracking-normal">
            {menuSubtitle}
          </p>
          {showSelectCategories ? (
            <AppLink
              href={categoriesPickerHref}
              prefetchPolicy="intent"
              className="mt-4 inline-flex h-[46px] w-full items-center justify-center rounded-[40px] bg-[#ff7f20] px-6 text-base font-semibold text-white lg:hidden"
            >
              {selectCategoriesLabel}
            </AppLink>
          ) : null}
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 28, y: 12 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: SHOP_EASE, delay: 0.12 }}
        >
          <Suspense
            fallback={
              <div className="flex h-[83px] flex-wrap items-center gap-2 xl:pt-[37px]" />
            }
          >
            <ShopCatalogFilters
              key={filterKey}
              priceLabel={priceLabel}
              priceFromLabel={priceFromLabel}
              priceToLabel={priceToLabel}
              dietFilterLabel={dietFilterLabel}
              dietNoneLabel={dietNoneLabel}
              dietVegetarianLabel={dietVegetarianLabel}
              dietSpicyLabel={dietSpicyLabel}
              minPrice={minPrice}
              maxPrice={maxPrice}
              diet={diet}
            />
          </Suspense>
        </motion.div>
      </motion.div>

      {products.length === 0 ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: SHOP_EASE }}
        >
          <ShopEmptyState
            title={emptyTitle}
            description={emptyDescription}
            ctaLabel={emptyCtaLabel}
            ctaHref={emptyCtaHref}
          />
        </motion.div>
      ) : (
        <ShopCatalogProductGrids
          locale={locale}
          products={products}
          wishlistLabel={wishlistLabel}
          addToCartLabel={addToCartLabel}
          outOfStockLabel={outOfStockLabel}
          rating={rating}
          isSignedIn={isSignedIn}
        />
      )}

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: SHOP_EASE, delay: 0.1 }}
      >
        <ShopPagination
          ariaLabel={paginationLabel}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
          currentPage={currentPage}
          totalPages={totalPages}
          buildHref={buildPageHref}
        />
      </motion.div>
    </section>
  );
}

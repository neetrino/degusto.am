"use client";

import { Suspense } from "react";
import { motion, useReducedMotion } from "motion/react";

import { useCatalogNav } from "@/features/products/ui/shop/CatalogNavContext";
import { ShopCatalogFilters } from "@/features/products/ui/shop/ShopCatalogFilters";
import { ShopMobileCategoryChips } from "@/features/products/ui/shop/ShopMobileCategoryChips";
import { ShopMobilePriceFilter } from "@/features/products/ui/shop/ShopMobilePriceFilter";
import { ShopCatalogLoadingState } from "@/features/products/ui/shop/ShopCatalogLoadingState";
import { ShopCatalogProductGrids } from "@/features/products/ui/shop/ShopCatalogProductGrids";
import { ShopEmptyState } from "@/features/products/ui/shop/ShopEmptyState";
import { ShopPagination } from "@/features/products/ui/shop/ShopPagination";
import type { ShopCategoryItem } from "@/features/products/ui/shop/ShopCategorySidebar";
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
  categoriesNavLabel: string;
  allCategoriesLabel: string;
  allCategoriesHref: string;
  categories: readonly ShopCategoryItem[];
  selectedSlug: string;
  priceLabel: string;
  priceChipLabel: string;
  pricePopoverTitle: string;
  priceMinLabel: string;
  priceMaxLabel: string;
  priceFromLabel: string;
  priceToLabel: string;
  currencySymbol: string;
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
  emptySearchTitle: string;
  emptySearchDescription: string;
  emptyCtaLabel: string;
  emptyCtaHref: string;
  loadingLabel: string;
  searchQuery: string;
  products: readonly CatalogCard[];
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  rating: number;
  isSignedIn: boolean;
  paginationLabel: string;
  firstLabel: string;
  previousLabel: string;
  nextLabel: string;
  lastLabel: string;
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
 * Shared shop catalog body — Motion title/filters/grid.
 */
export function ShopCatalogPanel({
  locale,
  menuTitle,
  menuSubtitle,
  categoriesNavLabel,
  allCategoriesLabel,
  allCategoriesHref,
  categories,
  selectedSlug,
  priceLabel,
  priceChipLabel,
  pricePopoverTitle,
  priceMinLabel,
  priceMaxLabel,
  priceFromLabel,
  priceToLabel,
  currencySymbol,
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
  emptySearchTitle,
  emptySearchDescription,
  emptyCtaLabel,
  emptyCtaHref,
  loadingLabel,
  searchQuery,
  products,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  rating,
  isSignedIn,
  paginationLabel,
  firstLabel,
  previousLabel,
  nextLabel,
  lastLabel,
  currentPage,
  totalPages,
  paginationLocale,
  paginationCategory,
  paginationMin,
  paginationMax,
  paginationQuery,
  paginationDiet,
}: ShopCatalogPanelProps) {
  const reduceMotion = useReducedMotion();
  const catalogNav = useCatalogNav();
  const isPending = catalogNav?.isPending ?? false;
  const trimmedQuery = searchQuery.trim();
  const emptyStateTitle = trimmedQuery ? emptySearchTitle : emptyTitle;
  const emptyStateDescription = trimmedQuery
    ? emptySearchDescription.replace("{query}", trimmedQuery)
    : emptyDescription;

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

  return (
    <section className="relative min-w-0 flex-1">
      <div className="relative z-30 mb-[42px] mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-4 lg:mt-0 xl:relative xl:z-auto xl:mt-0 xl:flex xl:gap-6 xl:justify-between">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: SHOP_EASE }}
          className="col-start-1 row-start-1 min-w-0 xl:max-w-xl"
        >
          <h1 className="text-[32px] leading-tight font-bold text-brand-headline lg:text-4xl xl:text-[60px] xl:leading-[51px]">
            {menuTitle}
          </h1>
          <p className="mt-2 hidden text-sm tracking-[-0.2px] text-[#717182] lg:mt-3 lg:block lg:text-base lg:tracking-normal">
            {menuSubtitle}
          </p>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: SHOP_EASE, delay: 0.06 }}
          className="col-start-2 row-start-1 min-w-0 justify-self-end xl:shrink-0"
        >
          <div className="xl:hidden">
            <Suspense fallback={<div className="h-10 w-20" aria-busy="true" />}>
              <ShopMobilePriceFilter
                key={`mobile-price-${filterKey}`}
                chipLabel={priceChipLabel}
                popoverTitle={pricePopoverTitle}
                minLabel={priceMinLabel}
                maxLabel={priceMaxLabel}
                currencySymbol={currencySymbol}
                minPrice={minPrice}
                maxPrice={maxPrice}
              />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <div
                className="hidden h-[83px] flex-wrap items-center gap-2 xl:flex xl:pt-[37px]"
                aria-busy="true"
              />
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

        <div className="col-span-2 min-w-0 xl:hidden">
          <ShopMobileCategoryChips
            label={categoriesNavLabel}
            allLabel={allCategoriesLabel}
            allHref={allCategoriesHref}
            categories={categories}
            selectedSlug={selectedSlug}
          />
        </div>
      </div>

      {isPending ? (
        <ShopCatalogLoadingState label={loadingLabel} />
      ) : products.length === 0 ? (
        <motion.div
          key={`empty-${filterKey}-${currentPage}-${trimmedQuery}`}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: SHOP_EASE }}
        >
          <ShopEmptyState
            title={emptyStateTitle}
            description={emptyStateDescription}
            ctaLabel={emptyCtaLabel}
            ctaHref={emptyCtaHref}
          />
        </motion.div>
      ) : (
        <ShopCatalogProductGrids
          key={`${filterKey}-${currentPage}-${paginationCategory ?? "all"}-${paginationQuery ?? ""}-${products[0]?.id ?? "none"}`}
          locale={locale}
          products={products}
          wishlistLabel={wishlistLabel}
          addToCartLabel={addToCartLabel}
          outOfStockLabel={outOfStockLabel}
          rating={rating}
          isSignedIn={isSignedIn}
        />
      )}

      {!isPending && products.length > 0 ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: SHOP_EASE, delay: 0.08 }}
        >
          <ShopPagination
            ariaLabel={paginationLabel}
            firstLabel={firstLabel}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
            lastLabel={lastLabel}
            currentPage={currentPage}
            totalPages={totalPages}
            buildHref={buildPageHref}
          />
        </motion.div>
      ) : null}
    </section>
  );
}

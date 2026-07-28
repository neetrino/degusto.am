import { Suspense } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { HomeMobileProductCard } from "@/features/home/ui/HomeMobileProductCard";
import { CatalogProductCard } from "@/features/products/ui/shop/CatalogProductCard";
import { ShopCatalogFilters } from "@/features/products/ui/shop/ShopCatalogFilters";
import { ShopEmptyState } from "@/features/products/ui/shop/ShopEmptyState";
import { ShopPagination } from "@/features/products/ui/shop/ShopPagination";
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
  buildPageHref: (page: number) => string;
};

/**
 * Shared shop catalog body (title, filters, product grid, pagination).
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
  buildPageHref,
}: ShopCatalogPanelProps) {
  return (
    <section className="min-w-0 flex-1">
      <div className="mb-[42px] mt-2 flex flex-col gap-6 xl:mt-0 xl:flex-row xl:items-start xl:justify-between lg:mt-0">
        <div className="min-w-0 max-w-xl">
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
        </div>

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
      </div>

      {products.length === 0 ? (
        <ShopEmptyState
          title={emptyTitle}
          description={emptyDescription}
          ctaLabel={emptyCtaLabel}
          ctaHref={emptyCtaHref}
        />
      ) : (
        <>
          <div className="mt-8 grid min-w-0 grid-cols-2 gap-x-[14px] gap-y-[30px] lg:hidden">
            {products.map((product, index) => (
              <HomeMobileProductCard
                key={product.id}
                href={product.href}
                title={product.title}
                priceFormatted={product.priceFormatted}
                compareAtFormatted={product.compareAtFormatted}
                discountPercent={product.discountPercent}
                imageUrl={product.imageUrl}
                inStock={product.inStock}
                priority={index < 4}
                locale={locale}
                productId={product.id}
                inWishlist={product.inWishlist}
                isSignedIn={isSignedIn}
                wishlistLabel={wishlistLabel}
                addToCartLabel={addToCartLabel}
                outOfStockLabel={outOfStockLabel}
                categoryLabel={product.categoryLabel}
                rating={rating}
                isSpicy={product.isSpicy ?? true}
                isVegetarian={product.isVegetarian ?? true}
              />
            ))}
          </div>

          <div className="hidden min-w-0 grid-cols-2 gap-4 lg:grid xl:grid-cols-3 xl:gap-[30px]">
            {products.map((product, index) => (
              <CatalogProductCard
                key={product.id}
                href={product.href}
                title={product.title}
                priceFormatted={product.priceFormatted}
                compareAtFormatted={product.compareAtFormatted}
                discountPercent={product.discountPercent}
                imageUrl={product.imageUrl}
                inStock={product.inStock}
                priority={index < 6}
                locale={locale}
                productId={product.id}
                inWishlist={product.inWishlist}
                isSignedIn={isSignedIn}
                wishlistLabel={wishlistLabel}
                addToCartLabel={addToCartLabel}
                outOfStockLabel={outOfStockLabel}
                categoryLabel={product.categoryLabel}
                rating={rating}
                isSpicy={product.isSpicy ?? true}
                isVegetarian={product.isVegetarian ?? true}
              />
            ))}
          </div>
        </>
      )}

      <ShopPagination
        ariaLabel={paginationLabel}
        previousLabel={previousLabel}
        nextLabel={nextLabel}
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={buildPageHref}
      />
    </section>
  );
}

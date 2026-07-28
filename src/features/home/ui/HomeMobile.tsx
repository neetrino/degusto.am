import Image from "next/image";

import { LocaleCurrencySwitcher } from "@/components/layout/LocaleCurrencySwitcher";
import { AppLink } from "@/components/ui/AppLink";
import { DailyOfferMobileCarousel } from "@/features/home/ui/DailyOfferMobileCarousel";
import { HomeMobileCategories } from "@/features/home/ui/HomeMobileCategories";
import {
  HomeMobileMotionShell,
  HomeMobileSheet,
} from "@/features/home/ui/HomeMobileMotionShell";
import { HomeMobileProductCard } from "@/features/home/ui/HomeMobileProductCard";
import { HomeMobileSearch } from "@/features/home/ui/HomeMobileSearch";
import { HomeReveal } from "@/features/home/ui/HomeReveal";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type CategoryItem = {
  id: string;
  href: string;
  title: string;
  imageUrl: string;
};

type ProductItem = {
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

type HomeMobileProps = {
  locale: Locale;
  currency: Currency;
  brand: string;
  callLabel: string;
  phoneHref: string;
  currencyLabel: string;
  languageLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  categoriesTitle: string;
  viewAllCategoriesLabel: string;
  viewAllCategoriesHref: string;
  newProductsTitle: string;
  viewAllHref: string;
  dailyOfferLabel: string;
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  isSignedIn: boolean;
  categories: readonly CategoryItem[];
  dailyOffers: readonly ProductItem[];
  products: readonly ProductItem[];
};

/**
 * Mobile-only home composition matching live degusto-am
 * (orange chrome + search + white sheet + chips + daily offers + new products).
 */
export function HomeMobile({
  locale,
  currency,
  brand,
  callLabel,
  phoneHref,
  currencyLabel,
  languageLabel,
  searchLabel,
  searchPlaceholder,
  categoriesTitle,
  viewAllCategoriesLabel,
  viewAllCategoriesHref,
  newProductsTitle,
  viewAllHref,
  dailyOfferLabel,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  isSignedIn,
  categories,
  dailyOffers,
  products,
}: HomeMobileProps) {
  return (
    <HomeMobileMotionShell>
      <header className="relative z-[100] overflow-visible px-4 pt-[58px]">
        <HomeReveal variant="up" durationMs={700} amount={0.1}>
          <div className="relative z-20 flex translate-y-5 items-start justify-between overflow-visible">
            <AppLink
              href={`/${locale}`}
              prefetchPolicy="intent"
              className="inline-flex shrink-0"
              aria-label={brand}
            >
              <Image
                src="/assets/mobile/degusto-logo-mobile.webp"
                alt={brand}
                width={129}
                height={46}
                className="h-[46px] w-[129px] object-contain"
                priority
              />
            </AppLink>
            <div className="flex items-center gap-1">
              <a
                href={phoneHref}
                aria-label={callLabel}
                className="relative inline-flex size-12 items-center justify-center"
              >
                <Image
                  src="/assets/mobile/call-btn-bg.webp"
                  alt=""
                  width={48}
                  height={48}
                  className="absolute inset-0 size-12 object-contain"
                  aria-hidden
                />
                <Image
                  src="/assets/mobile/call-icon.webp"
                  alt=""
                  width={23}
                  height={23}
                  className="relative h-[23px] w-[23px] object-contain"
                  aria-hidden
                />
              </a>
              <LocaleCurrencySwitcher
                locale={locale}
                currency={currency}
                currencyLabel={currencyLabel}
                languageLabel={languageLabel}
                variant="mobileHome"
              />
            </div>
          </div>
        </HomeReveal>

        <HomeReveal variant="up" delayMs={80} durationMs={700} amount={0.1}>
          <div className="relative z-0">
            <HomeMobileSearch
              locale={locale}
              searchLabel={searchLabel}
              placeholder={searchPlaceholder}
            />
          </div>
        </HomeReveal>
      </header>

      <HomeMobileSheet>
        <HomeReveal variant="up" durationMs={750}>
          <HomeMobileCategories
            title={categoriesTitle}
            viewAllLabel={viewAllCategoriesLabel}
            viewAllHref={viewAllCategoriesHref}
            categories={categories}
          />
        </HomeReveal>

        <HomeReveal variant="up" delayMs={60} durationMs={750}>
          <DailyOfferMobileCarousel
            offers={dailyOffers}
            dailyOfferLabel={dailyOfferLabel}
            addToCartLabel={addToCartLabel}
          />
        </HomeReveal>

        <HomeReveal variant="up" delayMs={100} durationMs={800}>
          <div className="mt-[30px] space-y-[22px] px-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base leading-5 font-semibold text-black">
                {newProductsTitle}
              </h2>
              <AppLink
                href={viewAllHref}
                prefetchPolicy="intent"
                className="rounded-full px-2 py-1 text-base leading-6 font-bold text-[#f66a13]"
              >
                {viewAllCategoriesLabel}
              </AppLink>
            </div>

            <div className="grid grid-cols-2 gap-x-[14px] gap-y-[30px]">
              {products.slice(0, 4).map((product, index) => (
                <HomeReveal
                  key={product.id}
                  variant="scale"
                  delayMs={index * 70}
                  durationMs={650}
                >
                  <HomeMobileProductCard
                    href={product.href}
                    title={product.title}
                    priceFormatted={product.priceFormatted}
                    compareAtFormatted={product.compareAtFormatted}
                    discountPercent={product.discountPercent}
                    imageUrl={product.imageUrl}
                    inStock={product.inStock}
                    priority={index < 2}
                    locale={locale}
                    productId={product.id}
                    inWishlist={product.inWishlist ?? false}
                    isSignedIn={isSignedIn}
                    wishlistLabel={wishlistLabel}
                    addToCartLabel={addToCartLabel}
                    outOfStockLabel={outOfStockLabel}
                    categoryLabel={product.categoryLabel}
                    rating={product.rating}
                    isSpicy={product.isSpicy}
                    isVegetarian={product.isVegetarian}
                  />
                </HomeReveal>
              ))}
            </div>
          </div>
        </HomeReveal>
      </HomeMobileSheet>
    </HomeMobileMotionShell>
  );
}

import Image from "next/image";
import { Phone } from "lucide-react";

import { LocaleCurrencySwitcher } from "@/components/layout/LocaleCurrencySwitcher";
import { AppLink } from "@/components/ui/AppLink";
import { DailyOfferMobileCarousel } from "@/features/home/ui/DailyOfferMobileCarousel";
import { ProductCard } from "@/features/products/ui/ProductCard";
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
  categoriesTitle: string;
  viewAllCategoriesLabel: string;
  viewAllCategoriesHref: string;
  newProductsTitle: string;
  viewAllLabel: string;
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
 * (orange chrome + white sheet + chips + daily offers + new products).
 */
export function HomeMobile({
  locale,
  currency,
  brand,
  callLabel,
  phoneHref,
  currencyLabel,
  languageLabel,
  categoriesTitle,
  viewAllCategoriesLabel,
  viewAllCategoriesHref,
  newProductsTitle,
  viewAllLabel,
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
    <div className="relative min-h-screen w-full overflow-x-clip bg-[var(--project-color)] lg:hidden">
      <div
        className="pointer-events-none absolute -top-[123px] -left-[210px] h-[434px] w-[418px] rounded-full border-[80px] border-brand-forest"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-[184px] -right-[160px] h-[320px] w-[360px] rounded-full border-[70px] border-brand-forest"
        aria-hidden
      />

      <header className="relative z-[100] px-4 pt-[58px]">
        <div className="relative z-20 flex translate-y-5 items-start justify-between">
          <AppLink
            href={`/${locale}`}
            prefetchPolicy="intent"
            className="inline-flex shrink-0"
            aria-label={brand}
          >
            <Image
              src="/assets/footer/logo.webp"
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
              className="inline-flex size-12 items-center justify-center rounded-full bg-white text-brand shadow-sm"
            >
              <Phone className="size-5" aria-hidden />
            </a>
            <LocaleCurrencySwitcher
              locale={locale}
              currency={currency}
              currencyLabel={currencyLabel}
              languageLabel={languageLabel}
            />
          </div>
        </div>
      </header>

      <div className="relative z-10 mt-[87px] rounded-t-[28px] bg-white px-4 pt-8 pb-[110px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base leading-5 font-semibold text-black">
            {categoriesTitle}
          </h2>
          <AppLink
            href={viewAllCategoriesHref}
            prefetchPolicy="intent"
            className="inline-flex items-center justify-center rounded-full px-2 py-1 text-base leading-6 font-bold text-brand-headline"
          >
            {viewAllCategoriesLabel}
          </AppLink>
        </div>

        {categories.length > 0 ? (
          <div className="-mx-3 mt-4 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max items-start gap-2">
              {categories.map((category) => (
                <AppLink
                  key={category.id}
                  href={category.href}
                  prefetchPolicy="intent"
                  aria-label={category.title}
                  className="w-14 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-headline"
                >
                  <div className="relative mx-auto flex h-[72px] w-12 items-center justify-center rounded-[24px] bg-[#090909]">
                    <Image
                      src={category.imageUrl}
                      alt={category.title}
                      width={40}
                      height={42}
                      className="relative h-[42px] w-10 rounded-[10px] object-cover"
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-center text-[11px] leading-tight text-black">
                    {category.title}
                  </p>
                </AppLink>
              ))}
            </div>
          </div>
        ) : null}

        <DailyOfferMobileCarousel
          offers={dailyOffers}
          dailyOfferLabel={dailyOfferLabel}
          addToCartLabel={addToCartLabel}
        />

        <div className="mt-[30px] space-y-[22px]">
          <div className="flex items-center justify-between">
            <h2 className="text-base leading-5 font-semibold text-black">
              {newProductsTitle}
            </h2>
            <AppLink
              href={viewAllHref}
              prefetchPolicy="intent"
              className="px-2 py-1 text-base leading-6 font-bold text-brand-headline"
            >
              {viewAllLabel} →
            </AppLink>
          </div>

          <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {products.slice(0, 4).map((product, index) => (
              <div key={product.id} className="w-[170px] shrink-0">
                <div className="origin-top-left scale-[0.72]">
                  <ProductCard
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
                    showWishlist
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

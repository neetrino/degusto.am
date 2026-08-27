import type { ReactNode } from "react";

import { StorefrontMobileChrome } from "@/components/layout/StorefrontMobileChrome";
import { ProductDetailMain } from "@/features/products/ui/ProductDetailMain";
import { ProductReveal } from "@/features/products/ui/ProductReveal";
import { ProductSmoothScroll } from "@/features/products/ui/ProductSmoothScroll";
import type { ProductDetail } from "@/features/products/types";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type MobileChromeProps = {
  locale: Locale;
  brand: string;
  callLabel: string;
  phoneHref: string;
  languageLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
};

type ProductDetailViewProps = {
  locale: Locale;
  product: ProductDetail;
  priceFormatted: string;
  compareAtFormatted: string | null;
  isSignedIn: boolean;
  inWishlist: boolean;
  dictionary: Dictionary;
  jsonLd: Record<string, unknown>;
  relatedSlot: ReactNode;
  reviewsSlot: ReactNode;
  relatedSlotDesktop: ReactNode;
  reviewsSlotDesktop: ReactNode;
  ratingAverage?: number;
  mobileChrome: MobileChromeProps;
};

/** Storefront PDP — Degusto product detail with Motion. */
export function ProductDetailView({
  locale,
  product,
  priceFormatted,
  compareAtFormatted,
  isSignedIn,
  inWishlist,
  dictionary,
  jsonLd,
  relatedSlot,
  reviewsSlot,
  relatedSlotDesktop,
  reviewsSlotDesktop,
  ratingAverage = 5,
  mobileChrome,
}: ProductDetailViewProps) {
  const mainProps = {
    locale,
    product,
    priceFormatted,
    compareAtFormatted,
    isSignedIn,
    inWishlist,
    dictionary,
    ratingAverage,
  };

  return (
    <ProductSmoothScroll>
      <article data-pdp-page className="bg-white">
        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen lg:hidden">
          <StorefrontMobileChrome {...mobileChrome}>
            <ProductDetailMain {...mainProps} padded={false} />
            <ProductReveal variant="up" delayMs={80} className="mt-2">
              {relatedSlot}
            </ProductReveal>
            <ProductReveal variant="scale" delayMs={120} className="py-10">
              {reviewsSlot}
            </ProductReveal>
          </StorefrontMobileChrome>
        </div>

        <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-[7.5rem] hidden w-screen bg-white pt-[7.5rem] lg:block">
          <ProductDetailMain {...mainProps} padded />
          <ProductReveal variant="up" delayMs={60}>
            {relatedSlotDesktop}
          </ProductReveal>
          <ProductReveal
            variant="scale"
            delayMs={100}
            className="mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 py-12 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 md:py-16 lg:max-w-[min(1450px,calc(100%-3rem))]"
          >
            {reviewsSlotDesktop}
          </ProductReveal>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </article>
    </ProductSmoothScroll>
  );
}

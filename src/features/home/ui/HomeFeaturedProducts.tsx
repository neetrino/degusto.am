import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { ProductCard } from "@/features/products/ui/ProductCard";
import type { Locale } from "@/lib/i18n/config";

const VIEW_ALL_ARROW = "/assets/home/view-all-arrow.svg";

type FeaturedItem = {
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

type HomeFeaturedProductsProps = {
  locale: Locale;
  titleLead: string;
  titleAccent: string;
  viewAllLabel: string;
  viewAllHref: string;
  emptyLabel: string;
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  isSignedIn: boolean;
  products: readonly FeaturedItem[];
};

export function HomeFeaturedProducts({
  locale,
  titleLead,
  titleAccent,
  viewAllLabel,
  viewAllHref,
  emptyLabel,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  isSignedIn,
  products,
}: HomeFeaturedProductsProps) {
  return (
    <section className="relative left-1/2 right-1/2 z-10 -mt-2 -ml-[50vw] -mr-[50vw] w-screen rounded-t-[40px] bg-surface-dark pt-[77px] pb-20 md:-mt-4">
      <div className="mx-auto max-w-[1260px] px-4 sm:px-6 lg:px-8">
        <div className="mb-[55px] flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-3xl font-bold tracking-tight text-brand sm:text-4xl md:text-5xl lg:text-[60px] lg:leading-none">
            {titleLead}{" "}
            <span className="text-white">{titleAccent}</span>
          </h2>
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            className="inline-flex h-14 w-[140px] shrink-0 items-center justify-center gap-2 rounded-[40px] bg-brand px-6 text-base font-bold text-white transition hover:bg-brand-strong"
          >
            {viewAllLabel}
            <Image
              src={VIEW_ALL_ARROW}
              alt=""
              width={20}
              height={20}
              className="size-5"
              aria-hidden
            />
          </AppLink>
        </div>

        {products.length === 0 ? (
          <p className="text-white/70">{emptyLabel}</p>
        ) : (
          <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:justify-center sm:overflow-visible sm:px-0">
            {products.map((product, index) => (
              <div key={product.id} className="w-[236px] shrink-0">
                <ProductCard
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
                  inWishlist={product.inWishlist ?? false}
                  isSignedIn={isSignedIn}
                  wishlistLabel={wishlistLabel}
                  addToCartLabel={addToCartLabel}
                  outOfStockLabel={outOfStockLabel}
                  categoryLabel={product.categoryLabel}
                  rating={product.rating}
                  isSpicy={product.isSpicy}
                  isVegetarian={product.isVegetarian}
                  showWishlist={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

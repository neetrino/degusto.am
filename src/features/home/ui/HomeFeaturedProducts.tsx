import { AppLink } from "@/components/ui/AppLink";
import { ProductCard } from "@/features/products/ui/ProductCard";
import type { Locale } from "@/lib/i18n/config";

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

/** Desktop featured / novelties strip — live degusto-am parity. */
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
    <section className="relative left-1/2 right-1/2 isolate z-30 hidden min-h-[520px] w-screen -mt-10 -ml-[50vw] -mr-[50vw] rounded-t-[40px] bg-surface-ink pt-6 pb-14 lg:block lg:min-h-[640px] xl:min-h-[700px]">
      <div className="mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
        <div className="relative z-40 flex flex-col gap-6 pt-[70px] sm:flex-row sm:items-end sm:justify-between">
          <h2 className="relative z-40 font-display text-4xl font-black text-white md:text-6xl">
            <span className="text-brand-headline">{titleLead} </span>
            {titleAccent}
          </h2>
          <AppLink
            href={viewAllHref}
            prefetchPolicy="intent"
            className="group relative z-40 inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand px-6 py-4 text-lg font-bold text-white transition-[background-color] duration-[550ms] hover:bg-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 origin-left scale-x-0 rounded-full bg-[#2a2a2a] transition-transform duration-[550ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-x-100 motion-reduce:transition-none motion-reduce:group-hover:scale-x-100"
            />
            <span className="relative z-10 transition-colors duration-300 group-hover:text-brand">
              {viewAllLabel} →
            </span>
          </AppLink>
        </div>

        {products.length === 0 ? (
          <p className="mt-10 text-white/70">{emptyLabel}</p>
        ) : (
          <div className="mt-20 overflow-x-auto pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto flex w-max max-w-full flex-nowrap justify-start gap-2.5 xl:justify-center">
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
                    showWishlist
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

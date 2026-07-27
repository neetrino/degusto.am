import Image from "next/image";
import type { ReactNode } from "react";

import { ProductGallery } from "@/features/products/ui/ProductGallery";
import { ProductModifierPills } from "@/features/products/ui/ProductModifierPills";
import { ProductPurchaseControls } from "@/features/products/ui/ProductPurchaseControls";
import type { ProductDetail } from "@/features/products/types";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

const STAR_ICON = "/assets/product-card/star.webp";

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
  ratingAverage?: number;
};

/** Storefront PDP — Degusto product detail visual system. */
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
  ratingAverage = 5,
}: ProductDetailViewProps) {
  const labels = dictionary.product;
  const inStock = product.stockOnHand > 0;
  const categoryTitle = product.categories[0]?.title ?? null;
  const description = product.translation.description?.trim() ?? "";
  const showDescription =
    description.length > 0 &&
    description !== product.translation.title.trim();

  return (
    <article
      data-pdp-page
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-[7.5rem] w-screen bg-white pt-[7.5rem]"
    >
      <div className="mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 pb-10 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))] lg:pb-14">
        <section className="w-full overflow-hidden bg-white lg:rounded-[40px]">
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch lg:gap-[47px] xl:grid-cols-[minmax(0,47.5625rem)_minmax(0,1fr)]">
            <ProductGallery
              images={product.images}
              title={product.translation.title}
              discountPercent={product.discountPercent}
              inStock={inStock}
              outOfStockLabel={labels.outOfStock}
              expandLabel={labels.expandImage}
              closeLabel={labels.closeImage}
            />

            <div className="flex min-w-0 flex-col lg:min-h-full lg:py-2">
              <h1 className="mb-2 break-words text-[2rem] leading-normal font-bold text-product-ink md:text-[2.25rem]">
                {product.translation.title}
              </h1>

              <div
                className="mb-5 flex items-center gap-[3px] lg:gap-[5px]"
                aria-label={`Rating ${ratingAverage.toFixed(1)}`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Image
                    key={index}
                    src={STAR_ICON}
                    alt=""
                    width={28}
                    height={28}
                    className={`size-5 object-contain lg:size-7 ${
                      index < Math.round(ratingAverage)
                        ? "opacity-100"
                        : "opacity-35 grayscale"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>

              <div className="mb-4 flex flex-wrap items-baseline gap-x-3">
                <p className="text-[1.75rem] leading-none font-bold text-product-ink md:text-[2rem]">
                  {priceFormatted}
                </p>
                {compareAtFormatted ? (
                  <p className="text-base text-[#9a9a9a] line-through md:text-lg">
                    {compareAtFormatted}
                  </p>
                ) : null}
              </div>

              {categoryTitle ? (
                <p className="mb-5 max-w-[31.125rem] text-base leading-6 font-normal text-product-ink">
                  {categoryTitle} — {product.translation.title}
                </p>
              ) : null}

              {showDescription ? (
                <p className="mb-5 max-w-[31.125rem] whitespace-pre-wrap text-base leading-6 text-product-ink">
                  {description}
                </p>
              ) : null}

              <ProductModifierPills
                addLabel={labels.addModifier}
                excludeLabel={labels.excludeModifier}
                emptyLabel={labels.noModifierOptions}
              />

              <ProductPurchaseControls
                locale={locale}
                productId={product.id}
                stockOnHand={product.stockOnHand}
                inWishlist={inWishlist}
                isSignedIn={isSignedIn}
                wishlistLabel={dictionary.nav.wishlist}
                labels={{
                  quantity: labels.quantity,
                  decreaseQuantity: dictionary.cartDrawer.decreaseQuantity,
                  increaseQuantity: dictionary.cartDrawer.increaseQuantity,
                  addToCart: labels.addToCart,
                  adding: labels.adding,
                  outOfStock: labels.outOfStock,
                  added: labels.added,
                  error: labels.addError,
                }}
              />
            </div>
          </div>
        </section>
      </div>

      {relatedSlot}
      <div className="mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 py-12 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 md:py-16 lg:max-w-[min(1450px,calc(100%-3rem))]">
        {reviewsSlot}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </article>
  );
}

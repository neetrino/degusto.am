import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";

const STAR_ICON = "/assets/product-card/star.webp";
const SPICY_ICON = "/assets/product-card/spicy.webp";
const VEGGIE_ICON = "/assets/product-card/veggie.webp";

type ProductCardProps = {
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  priority?: boolean;
  locale?: Locale;
  productId?: string;
  inWishlist?: boolean;
  isSignedIn?: boolean;
  wishlistLabel?: string;
  addToCartLabel?: string;
  outOfStockLabel?: string;
  categoryLabel?: string | null;
  rating?: number | null;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  showWishlist?: boolean;
};

export function ProductCard({
  href,
  title,
  priceFormatted,
  compareAtFormatted = null,
  discountPercent = null,
  imageUrl,
  inStock,
  priority = false,
  locale,
  productId,
  inWishlist = false,
  isSignedIn = false,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel = "Out of stock",
  categoryLabel = null,
  rating = null,
  isSpicy = false,
  isVegetarian = false,
  showWishlist = true,
}: ProductCardProps) {
  const onSale = Boolean(compareAtFormatted);
  const canShowWishlist =
    showWishlist &&
    locale != null && productId != null && wishlistLabel != null;
  const showAddToCart = productId != null && addToCartLabel != null;

  return (
    <article className="group relative isolate mx-auto w-[236px] py-[7px] text-left text-base text-product-ink/60">
      <div className="relative z-0 h-[284px] w-[236px] shrink-0 rounded-[20px] border-[1.5px] border-[#dedede] bg-white">
        <AppLink
          href={href}
          prefetchPolicy={priority ? "intent" : "auto"}
          className="absolute top-[5px] left-1/2 z-[2] block h-[147px] w-[227px] -translate-x-1/2 overflow-hidden rounded-[18px] bg-gray-100"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="227px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              No image
            </span>
          )}
        </AppLink>

        {isVegetarian || isSpicy ? (
          <div className="absolute top-2 left-4 z-[3] flex flex-col gap-2">
            {isVegetarian ? (
              <span className="size-8 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={VEGGIE_ICON}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8"
                  aria-hidden
                />
              </span>
            ) : null}
            {isSpicy ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ff2b2e] p-1">
                <Image
                  src={SPICY_ICON}
                  alt=""
                  width={19}
                  height={19}
                  className="size-[19px] -rotate-[13deg] object-contain"
                  aria-hidden
                />
              </span>
            ) : null}
          </div>
        ) : null}

        {canShowWishlist ? (
          <WishlistButton
            locale={locale}
            productId={productId}
            initialInWishlist={inWishlist}
            isSignedIn={isSignedIn}
            label={wishlistLabel}
            size="sm"
            className="absolute top-[13px] right-4 z-[3] h-8 w-8 border border-[#dedede]/90 bg-white/95 text-gray-700 shadow-md hover:border-red-300 hover:bg-red-50 hover:text-red-500 hover:shadow-[0_4px_14px_rgba(239,68,68,0.35)]"
          />
        ) : null}

        <div className="absolute top-[170px] left-[14px] z-[5] min-h-[90px] w-[209px]">
          <div className="absolute top-0 left-0 flex w-[120px] flex-col items-start gap-[5px]">
            {rating != null ? (
              <div className="flex h-[21px] items-center gap-1.5">
                <Image
                  src={STAR_ICON}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5"
                  aria-hidden
                />
                <span className="text-base leading-[1.35] font-medium text-product-ink/60">
                  {rating.toFixed(1)}
                </span>
              </div>
            ) : null}
            <h3 className="line-clamp-2 text-base font-bold leading-snug text-product-ink">
              <AppLink
                href={href}
                prefetchPolicy={priority ? "intent" : "auto"}
                className="hover:underline"
              >
                {title}
              </AppLink>
            </h3>
            {categoryLabel ? (
              <p className="w-full truncate text-base font-medium text-[#a1a1a1]">
                {categoryLabel}
              </p>
            ) : null}
          </div>

          <div className="absolute top-0 left-[136px] h-[90px] w-[73px] text-sm text-product-ink">
            {discountPercent != null ? (
              <span className="absolute top-0 left-px inline-flex h-[30px] w-[72px] items-center justify-center rounded-full bg-brand text-sm font-bold leading-[30px] text-black">
                -{discountPercent}%
              </span>
            ) : null}
            <p className="absolute top-[50px] right-0 whitespace-nowrap text-right text-xl font-black text-product-ink">
              {priceFormatted}
            </p>
            {onSale ? (
              <p className="absolute top-[74px] right-0 whitespace-nowrap text-right text-sm font-light text-product-ink line-through">
                {compareAtFormatted}
              </p>
            ) : null}
          </div>
        </div>

        {!inStock ? (
          <span className="absolute bottom-14 left-3 z-10 rounded bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
            {outOfStockLabel}
          </span>
        ) : null}
      </div>

      {showAddToCart ? (
        <AddToCartButton
          productId={productId}
          label={addToCartLabel}
          disabled={!inStock}
          className="absolute top-[259px] left-[93px] z-[1] h-[52px] w-[51px]"
        />
      ) : null}
    </article>
  );
}

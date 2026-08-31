import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";
import { SHOW_DIET_UI } from "@/features/products/diet-ui";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

const STAR_ICON = staticAssetUrl("/assets/mobile/product-star.webp");
const VEGGIE_ICON = staticAssetUrl("/assets/mobile/product-veggie.webp");
const SPICY_ICON = staticAssetUrl("/assets/mobile/product-spicy.webp");
const ADD_CART_ICON = staticAssetUrl("/assets/mobile/product-add-cart.webp");

type HomeMobileProductCardProps = {
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  locale: Locale;
  productId: string;
  inWishlist?: boolean;
  isSignedIn?: boolean;
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  categoryLabel?: string | null;
  rating?: number | null;
  isSpicy?: boolean;
  isVegetarian?: boolean;
  priority?: boolean;
};

/**
 * Home / wishlist mobile product tile — Figma product card (node 1:1077).
 */
export function HomeMobileProductCard({
  href,
  title,
  priceFormatted,
  compareAtFormatted = null,
  discountPercent = null,
  imageUrl,
  inStock,
  locale,
  productId,
  inWishlist = false,
  isSignedIn = false,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  categoryLabel = null,
  rating = null,
  isSpicy = false,
  isVegetarian = false,
  priority = false,
}: HomeMobileProductCardProps) {
  return (
    <article
      data-home-product-card="true"
      className="relative flex h-full w-full cursor-pointer flex-col rounded-[20px] bg-[#ffeacc] pb-5"
    >
      <AppLink
        href={href}
        prefetchPolicy={priority ? "intent" : "auto"}
        aria-label={title}
        className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66913]"
      />

      <div className="relative mx-[4px] mt-[5px] aspect-[221/143] overflow-hidden rounded-[18px] bg-[#f3e6d2]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="50vw"
            className="object-cover object-center"
            priority={priority}
          />
        ) : null}

        <WishlistButton
          locale={locale}
          productId={productId}
          initialInWishlist={inWishlist}
          isSignedIn={isSignedIn}
          label={wishlistLabel}
          size="sm"
          className="absolute top-1.5 right-1.5 z-20 size-8 border border-white/70 bg-white/95 text-gray-700 shadow-md"
        />

        {SHOW_DIET_UI && isSpicy ? (
          <Image
            src={SPICY_ICON}
            alt=""
            width={22}
            height={22}
            className="absolute top-[6px] left-[5px] z-[2] size-[22px] object-contain"
            aria-hidden
          />
        ) : null}
        {SHOW_DIET_UI && isVegetarian ? (
          <Image
            src={VEGGIE_ICON}
            alt=""
            width={22}
            height={22}
            className={`absolute left-[5px] z-[2] size-[22px] object-contain ${isSpicy ? "top-[33px]" : "top-[6px]"}`}
            aria-hidden
          />
        ) : null}
      </div>

      <div className="relative z-[2] flex min-w-0 flex-1 flex-col px-2.5 pt-1.5 pb-1">
        <div className="flex items-center justify-between gap-1.5">
          {rating != null ? (
            <div className="flex items-center gap-1.5">
              <Image
                src={STAR_ICON}
                alt=""
                width={19}
                height={19}
                className="size-[19px] object-contain"
                aria-hidden
              />
              <p className="text-sm leading-none font-medium text-[rgba(60,47,47,0.62)]">
                {rating.toFixed(1)}
              </p>
            </div>
          ) : (
            <span />
          )}
          {discountPercent != null ? (
            <span className="inline-flex h-[25px] min-w-[65px] items-center justify-center rounded-[60px] bg-[#ff7f20] px-2 text-xs leading-none font-bold text-black">
              -{discountPercent}%
            </span>
          ) : null}
        </div>

        <h3 className="mt-1 min-h-[calc(2*1.15em)] text-sm leading-[1.15] font-bold text-[#3c2f2f]">
          <span className="line-clamp-2 break-words">{title}</span>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <p className="min-w-0 flex-1 line-clamp-1 text-sm leading-normal font-medium text-[#a1a1a1]">
            {categoryLabel ?? "\u00a0"}
          </p>
          <div className="shrink-0 text-right leading-tight">
            <p className="text-base font-black tabular-nums text-[#3c2f2f]">
              {priceFormatted}
            </p>
            {compareAtFormatted ? (
              <p className="text-xs font-medium text-[#a1a1a1] line-through tabular-nums">
                {compareAtFormatted}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {!inStock ? (
        <span className="absolute bottom-8 left-2 z-10 rounded bg-gray-900/90 px-2 py-1 text-[10px] font-semibold text-white">
          {outOfStockLabel}
        </span>
      ) : null}

      <AddToCartButton
        productId={productId}
        label={addToCartLabel}
        disabled={!inStock}
        iconSrc={ADD_CART_ICON}
        iconWidth={41}
        iconHeight={42}
        className="absolute bottom-0 left-1/2 z-20 h-[42px] w-[41px] -translate-x-1/2 translate-y-1/2"
      />
    </article>
  );
}

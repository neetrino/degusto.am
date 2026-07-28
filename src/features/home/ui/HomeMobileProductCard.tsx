import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";

const STAR_ICON = "/assets/mobile/product-star.webp";
const VEGGIE_ICON = "/assets/mobile/product-veggie.webp";
const SPICY_ICON = "/assets/mobile/product-spicy.webp";
const ADD_CART_ICON = "/assets/mobile/product-add-cart.webp";

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
 * Compact home mobile product tile matching live degusto-am grid cards.
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
      className="relative h-[240px] w-full cursor-pointer rounded-[20px] border-[1.5px] border-[#dedede] bg-white"
    >
      <AppLink
        href={href}
        prefetchPolicy={priority ? "intent" : "auto"}
        aria-label={title}
        className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66913]"
      />

      <div className="absolute top-[5px] right-1 left-1 h-[143px]">
        <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="50vw"
              className="rounded-[20px] object-cover"
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
            className="absolute top-1.5 right-1.5 z-20 size-8 border border-[#dedede]/90 bg-white/95 text-gray-700 shadow-md"
          />
        </div>
      </div>

      {isVegetarian ? (
        <Image
          src={VEGGIE_ICON}
          alt=""
          width={22}
          height={22}
          className="absolute top-[11px] left-[9px] z-[2] h-[22px] w-[22px] object-contain"
          aria-hidden
        />
      ) : null}
      {isSpicy ? (
        <Image
          src={SPICY_ICON}
          alt=""
          width={22}
          height={22}
          className={`absolute left-[9px] z-[2] h-[22px] w-[22px] object-contain ${isVegetarian ? "top-[38px]" : "top-[11px]"}`}
          aria-hidden
        />
      ) : null}

      {rating != null ? (
        <div className="absolute top-[150px] left-[9px] z-[2] flex items-center gap-1.5">
          <Image
            src={STAR_ICON}
            alt=""
            width={16}
            height={16}
            className="size-4 object-contain"
            aria-hidden
          />
          <p className="text-sm leading-none font-medium text-[rgba(60,47,47,0.62)]">
            {rating.toFixed(1)}
          </p>
        </div>
      ) : null}

      <div className="absolute top-[172px] left-[9px] z-[2] w-[calc(100%-90px)] pr-1">
        <h3 className="text-sm leading-[1.15] font-bold text-[#3c2f2f]">
          <span className="line-clamp-2">{title}</span>
        </h3>
        {categoryLabel ? (
          <p className="mt-0.5 truncate text-sm leading-[1.2] font-medium text-[#a1a1a1]">
            {categoryLabel}
          </p>
        ) : null}
      </div>

      {discountPercent != null ? (
        <span className="absolute top-[152px] right-2 z-[2] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-[#ff7f20] text-xs leading-none font-bold text-black">
          -{discountPercent}%
        </span>
      ) : null}

      <div className="absolute top-[182px] right-2 z-[2] flex max-w-[76px] flex-col items-end gap-0.5 text-right leading-tight">
        <p className="w-full break-words text-sm font-black tabular-nums text-[#3c2f2f]">
          {priceFormatted}
        </p>
        {compareAtFormatted ? (
          <p className="w-full break-words text-sm font-medium text-[#3c2f2f] line-through tabular-nums">
            {compareAtFormatted}
          </p>
        ) : null}
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
        iconWidth={42}
        iconHeight={42}
        className="absolute bottom-0 left-1/2 z-20 h-[42px] w-[42px] -translate-x-1/2 translate-y-1/2"
      />
    </article>
  );
}

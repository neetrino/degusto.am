import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";

const STAR_ICON = "/assets/product-card/star.webp";
const SPICY_ICON = "/assets/product-card/spicy.webp";
const VEGGIE_ICON = "/assets/product-card/veggie.webp";

type CatalogProductCardProps = {
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  priority?: boolean;
  locale: Locale;
  productId: string;
  inWishlist: boolean;
  isSignedIn: boolean;
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  categoryLabel?: string | null;
  rating?: number | null;
  isSpicy?: boolean;
  isVegetarian?: boolean;
};

/** Storefront shop/catalog product card — live degusto-am /shop parity. */
export function CatalogProductCard({
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
  inWishlist,
  isSignedIn,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  categoryLabel = null,
  rating = 5,
  isSpicy = false,
  isVegetarian = false,
}: CatalogProductCardProps) {
  const onSale = Boolean(compareAtFormatted);

  return (
    <article className="group relative h-[330px] w-full shrink-0 cursor-pointer rounded-[20px] border-[1.5px] border-[#dedede] bg-white transition-colors hover:bg-[#ffeacc] hover:shadow-md">
      <AppLink
        href={href}
        prefetchPolicy={priority ? "intent" : "auto"}
        aria-label={title}
        className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-headline"
      />

      <div className="relative mx-auto mt-1 h-[180px] w-[calc(100%-10px)]">
        <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 30vw, 50vw"
              className="rounded-[20px] object-cover transition-transform duration-300 group-hover:scale-105"
              priority={priority}
              unoptimized={
                imageUrl.includes("X-Amz-Signature") ||
                imageUrl.includes("X-Amz-Credential")
              }
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              No image
            </span>
          )}
        </div>

        {isVegetarian || isSpicy ? (
          <div className="absolute top-2 left-4 z-[3] flex flex-col gap-2">
            {isVegetarian ? (
              <span className="flex size-8 items-center justify-center overflow-hidden rounded-full">
                <Image
                  src={VEGGIE_ICON}
                  alt=""
                  width={32}
                  height={32}
                  className="size-8 scale-110 object-cover"
                  aria-hidden
                />
              </span>
            ) : null}
            {isSpicy ? (
              <span className="flex size-8 items-center justify-center rounded-full bg-[#ff2b2e] p-1">
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

        <WishlistButton
          locale={locale}
          productId={productId}
          initialInWishlist={inWishlist}
          isSignedIn={isSignedIn}
          label={wishlistLabel}
          size="sm"
          className="absolute top-2 right-2 z-20 h-9 w-9 border border-[#dedede]/90 bg-white/95 text-gray-700 shadow-md transition-all duration-300 hover:scale-110 hover:border-red-300 hover:bg-red-50 hover:text-red-500 hover:shadow-[0_4px_14px_rgba(239,68,68,0.35)] active:scale-95 sm:h-10 sm:w-10"
        />
      </div>

      <AddToCartButton
        productId={productId}
        label={addToCartLabel}
        disabled={!inStock}
        className="absolute -bottom-[25px] left-1/2 z-20 h-[52px] w-[51px] -translate-x-1/2"
      />

      {rating != null ? (
        <div className="absolute top-[215px] left-[14px] z-[2] flex items-center gap-1.5">
          <Image
            src={STAR_ICON}
            alt=""
            width={16}
            height={16}
            className="size-4 object-contain"
            aria-hidden
          />
          <p className="text-base leading-[1.35] font-medium text-product-ink/60">
            {rating.toFixed(1)}
          </p>
        </div>
      ) : null}

      {discountPercent != null ? (
        <span className="absolute top-[215px] right-px z-[2] inline-flex h-[30px] items-center rounded-[60px] bg-[#ff7f20] px-[17px] text-sm leading-none font-bold text-black">
          -{discountPercent}%
        </span>
      ) : null}

      <div className="absolute top-[239px] right-[14px] left-[14px] z-[2] min-w-0 pb-8">
        <h3 className="text-base leading-[1.15] font-bold text-product-ink">
          <span className="line-clamp-2 break-words">{title}</span>
        </h3>
        <div className="mt-1 flex items-start justify-between gap-2">
          {categoryLabel ? (
            <p className="min-w-0 flex-1 text-sm leading-[1.25] font-medium break-words text-[#a1a1a1] line-clamp-2 sm:text-base">
              {categoryLabel}
            </p>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}
          <div className="shrink-0 text-right leading-tight">
            <p className="text-[18px] leading-none font-black whitespace-nowrap text-product-ink sm:text-[20px]">
              {priceFormatted}
            </p>
            {onSale ? (
              <p className="mt-1 text-sm leading-none font-light whitespace-nowrap text-product-ink line-through">
                {compareAtFormatted}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {!inStock ? (
        <span className="absolute bottom-16 left-3 z-10 rounded bg-gray-900/90 px-2 py-1 text-xs font-semibold text-white">
          {outOfStockLabel}
        </span>
      ) : null}
    </article>
  );
}

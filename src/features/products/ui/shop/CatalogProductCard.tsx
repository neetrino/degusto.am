import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";
import { SHOW_DIET_UI } from "@/features/products/diet-ui";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

const STAR_ICON = staticAssetUrl("/assets/product-card/star.webp");
const SPICY_ICON = staticAssetUrl("/assets/product-card/spicy.webp");
const VEGGIE_ICON = staticAssetUrl("/assets/product-card/veggie.webp");
const ADD_CART_ICON_MOBILE = staticAssetUrl("/assets/mobile/product-add-cart.webp");

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

/**
 * Storefront shop/catalog product card.
 * Mobile matches Figma product card (node 1:1077); desktop keeps larger catalog chrome.
 */
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
    <article className="group relative flex h-full w-full shrink-0 cursor-pointer flex-col rounded-[20px] border-0 bg-[#ffeacc] pb-5 transition-colors lg:border-[1.5px] lg:border-[#dedede] lg:bg-white lg:pb-8 lg:hover:bg-[#ffeacc] lg:hover:shadow-md">
      <AppLink
        href={href}
        prefetchPolicy={priority ? "intent" : "auto"}
        aria-label={title}
        className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-headline"
      />

      <div className="relative mx-[4px] mt-[5px] w-auto lg:mx-0 lg:mt-0 lg:w-full lg:px-[5px] lg:pt-[5px]">
        <div className="relative aspect-[221/143] w-full overflow-hidden rounded-[18px] bg-[#f3e6d2] lg:aspect-[3/2] lg:bg-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 30vw, 50vw"
              className="object-cover object-center transition-transform duration-300 lg:group-hover:scale-105"
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

          {SHOW_DIET_UI && (isVegetarian || isSpicy) ? (
            <div className="absolute top-[6px] left-[5px] z-[3] flex flex-col gap-1.5 lg:top-2 lg:left-4 lg:gap-2">
              {isSpicy ? (
                <span className="flex size-[22px] items-center justify-center rounded-full bg-[#ff2b2e] p-0.5 lg:size-8 lg:p-1">
                  <Image
                    src={SPICY_ICON}
                    alt=""
                    width={19}
                    height={19}
                    className="size-[13px] -rotate-[13deg] object-contain lg:size-[19px]"
                    aria-hidden
                  />
                </span>
              ) : null}
              {isVegetarian ? (
                <span className="flex size-[22px] items-center justify-center overflow-hidden rounded-full lg:size-8">
                  <Image
                    src={VEGGIE_ICON}
                    alt=""
                    width={32}
                    height={32}
                    className="size-[22px] object-cover lg:size-8 lg:scale-110"
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
            className="absolute top-1.5 right-1.5 z-20 size-8 border border-white/70 bg-white/95 text-gray-700 shadow-md transition-all duration-300 hover:scale-110 hover:border-red-300 hover:bg-red-50 hover:text-red-500 hover:shadow-[0_4px_14px_rgba(239,68,68,0.35)] active:scale-95 lg:top-2 lg:right-2 lg:size-10 lg:border-[#dedede]/90"
          />
        </div>
      </div>

      <div className="relative z-[2] flex min-w-0 flex-1 flex-col px-2.5 pt-1.5 pb-1 lg:px-3.5 lg:pt-2 lg:pb-0">
        <div className="flex items-center justify-between gap-1.5 lg:gap-2">
          {rating != null ? (
            <div className="flex items-center gap-1.5">
              <Image
                src={STAR_ICON}
                alt=""
                width={19}
                height={19}
                className="size-[19px] object-contain lg:size-4"
                aria-hidden
              />
              <p className="text-sm leading-none font-medium text-[rgba(60,47,47,0.62)] lg:text-base lg:leading-[1.35] lg:text-product-ink/60">
                {rating.toFixed(1)}
              </p>
            </div>
          ) : (
            <span />
          )}
          {discountPercent != null ? (
            <span className="inline-flex h-[25px] min-w-[65px] items-center justify-center rounded-[60px] bg-[#ff7f20] px-2 text-xs leading-none font-bold text-black lg:h-[30px] lg:min-w-0 lg:px-[17px] lg:text-sm">
              -{discountPercent}%
            </span>
          ) : null}
        </div>

        <h3 className="mt-1 min-h-[calc(2*1.15em)] text-sm leading-[1.15] font-bold text-[#3c2f2f] lg:min-h-0 lg:line-clamp-2 lg:text-base lg:leading-snug lg:text-product-ink">
          <span className="line-clamp-2 break-words">{title}</span>
        </h3>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1 lg:mt-1 lg:items-start lg:pt-0">
          {categoryLabel ? (
            <p className="min-w-0 flex-1 line-clamp-1 text-sm leading-normal font-medium text-[#a1a1a1] lg:line-clamp-2 lg:text-base lg:leading-snug lg:break-words">
              {categoryLabel}
            </p>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden>
              {"\u00a0"}
            </span>
          )}
          <div className="shrink-0 text-right leading-tight">
            <p className="text-base font-black tabular-nums text-[#3c2f2f] lg:text-[20px] lg:leading-none lg:whitespace-nowrap lg:text-product-ink">
              {priceFormatted}
            </p>
            {onSale ? (
              <p className="mt-0.5 text-xs font-medium text-[#a1a1a1] line-through tabular-nums lg:mt-1 lg:text-sm lg:leading-none lg:font-light lg:whitespace-nowrap lg:text-product-ink">
                {compareAtFormatted}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {!inStock ? (
        <span className="absolute bottom-8 left-2 z-10 rounded bg-gray-900/90 px-2 py-1 text-[10px] font-semibold text-white lg:bottom-16 lg:left-3 lg:text-xs">
          {outOfStockLabel}
        </span>
      ) : null}

      {/* Mobile cart icon (Figma ~41px); desktop keeps default catalog asset */}
      <AddToCartButton
        productId={productId}
        label={addToCartLabel}
        disabled={!inStock}
        iconSrc={ADD_CART_ICON_MOBILE}
        iconWidth={41}
        iconHeight={42}
        className="absolute bottom-0 left-1/2 z-20 h-[42px] w-[41px] -translate-x-1/2 translate-y-1/2 lg:hidden"
        snapshot={{
          title,
          imageUrl,
          unitPriceFormatted: priceFormatted,
        }}
      />
      <AddToCartButton
        productId={productId}
        label={addToCartLabel}
        disabled={!inStock}
        className="absolute -bottom-[25px] left-1/2 z-20 hidden h-[52px] w-[51px] -translate-x-1/2 lg:inline-flex"
        snapshot={{
          title,
          imageUrl,
          unitPriceFormatted: priceFormatted,
        }}
      />
    </article>
  );
}

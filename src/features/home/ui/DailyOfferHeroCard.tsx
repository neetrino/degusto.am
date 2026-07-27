"use client";

import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import { AddToCartButton } from "@/features/cart/ui/AddToCartButton";

const STAR_ICON = "/assets/product-card/star.svg";
const VEGGIE_ICON = "/assets/product-card/veggie.svg";
const DAILY_OFFER_STAR = "/assets/home/daily-offer-star.svg";

type DailyOfferHeroCardProps = {
  href: string;
  title: string;
  priceFormatted: string;
  imageUrl: string | null;
  inStock: boolean;
  productId: string;
  addToCartLabel: string;
  dailyOfferLabel: string;
  categoryLabel?: string | null;
  rating?: number | null;
  isVegetarian?: boolean;
};

/**
 * Desktop hero daily-offer card — matches live degusto-am
 * (`data-home-daily-offer-hero`) layout and star badge placement.
 */
export function DailyOfferHeroCard({
  href,
  title,
  priceFormatted,
  imageUrl,
  inStock,
  productId,
  addToCartLabel,
  dailyOfferLabel,
  categoryLabel = null,
  rating = 5,
  isVegetarian = true,
}: DailyOfferHeroCardProps) {
  return (
    <article
      data-home-daily-offer-hero="true"
      className="relative z-20 h-[284px] w-[236px] shrink-0 rounded-[20px]"
    >
      <AppLink
        href={href}
        prefetchPolicy="intent"
        className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-headline"
        aria-label={title}
      />
      <div className="absolute inset-0 rounded-[20px] bg-white shadow-xl" />

      <div className="absolute top-[5px] left-1/2 h-[147px] w-[227px] -translate-x-1/2 overflow-hidden rounded-[18px] bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="227px"
            className="object-cover"
            priority
          />
        ) : null}
        {isVegetarian ? (
          <div className="absolute top-2 left-[11px] z-[2] flex size-8 items-center justify-center overflow-hidden rounded-full">
            <Image
              src={VEGGIE_ICON}
              alt=""
              width={32}
              height={32}
              className="size-8 scale-110 object-cover"
              aria-hidden
            />
          </div>
        ) : null}
      </div>

      {rating != null ? (
        <div className="absolute top-[172px] left-[14px] z-[2] flex items-center gap-1.5">
          <Image
            src={STAR_ICON}
            alt=""
            width={16}
            height={16}
            className="size-4"
            aria-hidden
          />
          <p className="text-base leading-none font-medium text-product-ink/60">
            {rating.toFixed(1)}
          </p>
        </div>
      ) : null}

      <div className="absolute top-[194px] left-[14px] z-[2] w-[130px] min-w-0">
        <h2 className="text-base leading-[1.05] font-bold text-product-ink">
          <span className="block max-h-[34px] overflow-hidden break-words">
            {title}
          </span>
        </h2>
        {categoryLabel ? (
          <p className="mt-1 truncate text-base leading-[1.2] font-medium text-[#a1a1a1]">
            {categoryLabel}
          </p>
        ) : null}
      </div>

      <span className="absolute top-[228px] right-[14px] z-[2] text-[22px] leading-none font-black tracking-[-0.3px] text-product-ink">
        {priceFormatted}
      </span>

      <AddToCartButton
        productId={productId}
        label={addToCartLabel}
        disabled={!inStock}
        className="absolute bottom-[-25px] left-1/2 z-20 h-[52px] w-[51px] -translate-x-1/2 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-translate-y-1.5 active:scale-95 motion-reduce:transition-none"
      />

      <div className="pointer-events-none absolute -top-[46px] -right-[88px] z-30 h-[132px] w-[132px]">
        <Image
          src={DAILY_OFFER_STAR}
          alt=""
          width={132}
          height={132}
          className="absolute inset-0 size-full object-contain"
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center text-center text-[16px] leading-[1.1] font-black text-white">
          <span className="max-w-[77px] whitespace-pre-line">
            {dailyOfferLabel}
          </span>
        </div>
      </div>
    </article>
  );
}

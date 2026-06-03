'use client';

import type { MouseEvent } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { useCurrency } from '../hooks/useCurrency';
import { formatPrice } from '../../lib/currency';
import { useAddToCart } from '../hooks/useAddToCart';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import { HomeOptimizedImage } from './HomeOptimizedImage';
import { StorefrontProductOverlayLink } from './StorefrontProductOverlayLink';
import { HomeProductFoodAttributeBadges } from './HomeProductFoodAttributeBadges';
import type { HomeFeaturedProduct } from './home-page-types';

type HomeDailyOfferHeroCardAssets = {
  offerBadgeSrc: string;
  hotIconSrc: string;
  greensIconSrc: string;
  starIconSrc: string;
  addToCartIconSrc: string;
};

type HomeDailyOfferHeroCardProps = HomeDailyOfferHeroCardAssets & {
  product: HomeFeaturedProduct;
};

/**
 * Desktop home hero — daily-offer product card (Figma) with working add-to-cart.
 */
export function HomeDailyOfferHeroCard({
  product,
  offerBadgeSrc,
  hotIconSrc,
  greensIconSrc,
  starIconSrc,
  addToCartIconSrc,
}: HomeDailyOfferHeroCardProps) {
  const { t, lang } = useTranslation();
  const currency = useCurrency();
  const title = product.title;
  const subtitle = product.subtitle ?? '';
  const productHref = `/products/${product.slug}`;
  const imageSrc = resolveStorefrontProductImage(product.image);
  const discountPercent = Math.round(product.discountPercent ?? 0);
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: product.id,
    productSlug: product.slug,
    inStock: product.inStock ?? true,
    defaultVariantId: product.defaultVariantId ?? undefined,
    price: product.price ?? undefined,
  });

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const card = button.closest('[data-home-daily-offer-hero]');
    const origin =
      (card?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    void addToCart({ origin, imageUrl: imageSrc });
  };

  return (
    <article
      data-home-daily-offer-hero
      className="relative z-20 h-[284px] w-[236px] cursor-pointer rounded-[20px] sm:ml-[45px]"
    >
      <StorefrontProductOverlayLink slug={product.slug} label={title} />
      <div className="absolute inset-0 rounded-[20px] bg-white shadow-xl" />
      <div
        data-product-fly-origin
        className="absolute left-1/2 top-[5px] h-[147px] w-[227px] -translate-x-1/2 overflow-hidden rounded-[18px]"
      >
        <HomeOptimizedImage
          src={imageSrc}
          alt={t('home.figma.mobile.dailyOfferImageAlt')}
          width={227}
          height={147}
          className="h-full w-full object-cover"
          priority
          loading="eager"
          sizes="236px"
        />
        <HomeProductFoodAttributeBadges
          variant="desktop-hero"
          supportsSpicy={product.supportsSpicy ?? false}
          supportsGreens={product.supportsGreens ?? false}
          hotIconSrc={hotIconSrc}
          greensIconSrc={greensIconSrc}
        />
      </div>
      <div className="absolute left-[14px] top-[172px] flex items-center gap-1.5">
        <HomeOptimizedImage
          src={starIconSrc}
          alt=""
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
          loading="lazy"
        />
        <p className="text-base font-medium leading-none text-[rgba(60,47,47,0.62)]">4.7</p>
      </div>
      <div className="absolute left-[14px] top-[194px] w-[130px]">
        <h2 className="text-base font-bold leading-none text-[#3c2f2f]">
          <span className="block">{title}</span>
        </h2>
        <p className="mt-1 text-base font-medium leading-[1.2] text-[#a1a1a1]">{subtitle}</p>
      </div>
      {discountPercent > 0 ? (
        <span className="absolute right-[12px] top-[165px] inline-flex items-center rounded-[60px] bg-[#ff7f20] px-[17px] py-[8px] text-sm font-bold leading-none text-black">
          -{discountPercent}%
        </span>
      ) : null}
      <span className="absolute right-[14px] top-[228px] font-['Montserrat_arm','Montserrat',sans-serif] text-[22px] font-[1000] leading-none tracking-[-0.3px] text-[#3c2f2f]">
        {formatPrice(product.price ?? 0, currency)}
      </span>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAddingToCart || product.inStock === false}
        aria-label={t('common.buttons.addToCart')}
        className="absolute bottom-[-25px] left-1/2 z-20 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center disabled:opacity-50"
      >
        <HomeOptimizedImage
          src={addToCartIconSrc}
          alt=""
          width={51}
          height={52}
          className="h-[52px] w-[51px] object-contain"
          loading="lazy"
        />
      </button>
      <div className="pointer-events-none absolute -right-[88px] -top-[46px] h-[132px] w-[132px]">
        <HomeOptimizedImage
          src={offerBadgeSrc}
          alt=""
          width={132}
          height={132}
          className="absolute inset-0 h-full w-full object-contain"
          loading="lazy"
        />
        <div
          className={`absolute inset-0 flex items-center justify-center text-center font-black text-white ${
            lang === 'ru' ? 'text-[11px] leading-[1.05]' : 'text-[16px] leading-[1.1]'
          }`}
        >
          <span className={`whitespace-pre-line ${lang === 'ru' ? '-translate-x-[4px] max-w-[72px]' : ''}`}>
            {t('home.figma.mobile.dailyOfferTitle')}
          </span>
        </div>
      </div>
    </article>
  );
}

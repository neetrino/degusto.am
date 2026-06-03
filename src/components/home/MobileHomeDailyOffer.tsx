'use client';

import { ProductPageLink } from '@/components/products/ProductPageLink';
import type { MouseEvent } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { formatPrice } from '../../lib/currency';
import { useCurrency } from '../hooks/useCurrency';
import { useAddToCart } from '../hooks/useAddToCart';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import {
  MOBILE_HOME_DAILY_OFFER_GRADIENT_CLASS,
  MOBILE_HOME_DAILY_OFFER_PHOTO_LAYOUT_CLASS,
} from '@/constants/mobile-figma-storefront';
import type { HomeFeaturedProduct } from './home-page-types';
import { resolveMobileHomeDiscountPercent } from './home-mobile-helpers';
import { HomeOptimizedImage } from './HomeOptimizedImage';

type MobileHomeDailyOfferProps = {
  product: HomeFeaturedProduct;
  dailyOfferAddToCartSrc: string;
};

export function MobileHomeDailyOffer({ product, dailyOfferAddToCartSrc }: MobileHomeDailyOfferProps) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const title = product.title;
  const imageSrc = resolveStorefrontProductImage(product.image);
  const price = product.price ?? 0;
  const discountPercent = resolveMobileHomeDiscountPercent(product);
  const productHref = `/products/${product.slug}`;
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
    const card = button.closest('[data-mobile-daily-offer]');
    const origin =
      (card?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    void addToCart({ origin, imageUrl: imageSrc });
  };

  return (
    <article
      data-mobile-daily-offer
      className="relative h-32 w-full max-w-full cursor-pointer overflow-hidden rounded-[20px]"
    >
      <ProductPageLink
        slug={product.slug}
        className="absolute inset-0 z-[1] rounded-[inherit] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66913]"
        aria-label={title}
      />
      <div
        className={`absolute inset-0 ${MOBILE_HOME_DAILY_OFFER_GRADIENT_CLASS}`}
        aria-hidden
      />
      <div
        data-product-fly-origin
        className={`${MOBILE_HOME_DAILY_OFFER_PHOTO_LAYOUT_CLASS} relative overflow-hidden`}
      >
        <HomeOptimizedImage
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          priority
          loading="eager"
          sizes="50vw"
        />
      </div>
      <h3 className="absolute left-[11px] top-[10px] whitespace-pre-line text-[20px] font-bold leading-[21px] text-white">
        {t('home.figma.mobile.dailyOfferTitle')}
      </h3>
      <p className="absolute left-[11px] top-[57px] w-[102px] line-clamp-2 text-sm font-medium leading-[1.15] text-[rgba(255,255,255,0.89)]">
        {title}
      </p>
      <p className="absolute left-[11px] top-24 text-base font-black leading-none text-white">
        {formatPrice(price, currency)}
      </p>
      {discountPercent > 0 ? (
        <span className="absolute right-[10px] top-[15px] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-white text-xs font-bold text-black">
          -{discountPercent}%
        </span>
      ) : null}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAddingToCart || product.inStock === false}
        className="absolute left-[35.95%] top-[76px] z-10 inline-flex h-[41.669px] w-[41.096px] items-center justify-center disabled:opacity-50"
        aria-label={t('common.buttons.addToCart')}
      >
        <HomeOptimizedImage
          src={dailyOfferAddToCartSrc}
          alt=""
          width={41}
          height={42}
          className="h-[41.7px] w-[41.1px] object-contain"
          loading="lazy"
        />
      </button>
    </article>
  );
}

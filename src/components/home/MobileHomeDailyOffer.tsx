'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';
import { formatPrice } from '../../lib/currency';
import { useCurrency } from '../hooks/useCurrency';
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
  const router = useRouter();
  const title =
    product.title === 'Double Cheeseburger'
      ? t('home.figma.mobile.product.title')
      : (product.title || t('home.figma.mobile.product.title'));
  const imageSrc = resolveStorefrontProductImage(product.image);
  const price = product.price ?? 0;
  const discountPercent = resolveMobileHomeDiscountPercent(product);
  const productHref = `/products/${product.slug}`;

  return (
    <article
      className="relative h-32 w-full max-w-full cursor-pointer overflow-hidden rounded-[20px]"
      onClick={() => {
        router.push(productHref);
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        router.push(productHref);
      }}
      role="link"
      tabIndex={0}
      aria-label={title}
    >
      <div
        className={`absolute inset-0 ${MOBILE_HOME_DAILY_OFFER_GRADIENT_CLASS}`}
        aria-hidden
      />
      <div className={`${MOBILE_HOME_DAILY_OFFER_PHOTO_LAYOUT_CLASS} relative overflow-hidden`}>
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
        className="absolute left-[35.95%] top-[76px] inline-flex h-[41.669px] w-[41.096px] items-center justify-center"
        onClick={(event) => {
          event.stopPropagation();
          router.push(productHref);
        }}
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

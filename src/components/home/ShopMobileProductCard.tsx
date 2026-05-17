'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';
import { useCurrency } from '../hooks/useCurrency';
import { formatPrice } from '../../lib/currency';
import { useAddToCart } from '../hooks/useAddToCart';
import { MOBILE_SHOP_PRODUCT_CARD_ASSETS } from '@/constants/mobile-figma-storefront';
import type { MenuCard } from './menu-types';

/** Figma mobile product card (1:2235) — compact price typography. */
function getShopMobileProductCardPriceSizeClass(formattedPrice: string): string {
  const length = formattedPrice.length;
  if (length >= 14) {
    return 'text-[11px]';
  }
  if (length >= 11) {
    return 'text-xs';
  }
  return 'text-sm';
}

type ShopMobileProductCardProps = {
  card: MenuCard;
};

/**
 * Mobile shop/combo product card — cream Figma layout (node 1:2235), 2-column grid.
 */
export function ShopMobileProductCard({ card }: ShopMobileProductCardProps) {
  const { t } = useTranslation();
  const currency = useCurrency();
  const router = useRouter();
  const title = card.title || t(card.titleKey);
  const category = card.category || (card.categoryKey ? t(card.categoryKey) : '');
  const imageSrc = card.image || MOBILE_SHOP_PRODUCT_CARD_ASSETS.fallbackImage;
  const formattedPrice = formatPrice(card.price, currency);
  const formattedOldPrice = formatPrice(card.oldPrice, currency);
  const priceSizeClass = getShopMobileProductCardPriceSizeClass(formattedPrice);
  const oldPriceSizeClass = getShopMobileProductCardPriceSizeClass(formattedOldPrice);
  const calculatedDiscountPercent =
    card.oldPrice > card.price && card.oldPrice > 0
      ? Math.round(((card.oldPrice - card.price) / card.oldPrice) * 100)
      : 0;
  const fallbackDiscountPercent =
    typeof card.discountPercent === 'number' && card.discountPercent > 0
      ? Math.round(card.discountPercent)
      : 0;
  const effectiveDiscountPercent = calculatedDiscountPercent || fallbackDiscountPercent;
  const hasDiscount = effectiveDiscountPercent > 0;
  const discountText = hasDiscount ? `-${effectiveDiscountPercent}%` : '';
  const supportsSpicy = card.supportsSpicy ?? false;
  const supportsGreens = card.supportsGreens ?? false;
  const greensTopClass = supportsSpicy ? 'top-[38px]' : 'top-[11px]';
  const productHref = `/products/${card.slug}`;
  const { isAddingToCart, addToCart } = useAddToCart({
    productId: card.id,
    productSlug: card.slug,
    inStock: card.inStock ?? true,
    defaultVariantId: card.defaultVariantId ?? undefined,
    price: card.price,
  });

  const handleOpenProduct = () => {
    router.push(productHref);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    handleOpenProduct();
  };

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const cardRoot = button.closest('[data-home-product-card]');
    const origin =
      (cardRoot?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    void addToCart({ origin, imageUrl: card.image || null });
  };

  return (
    <article
      data-home-product-card
      className="relative h-[240px] w-full cursor-pointer rounded-[20px] bg-[#ffeacc]"
      onClick={handleOpenProduct}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      aria-label={title}
    >
      <div
        data-product-fly-origin
        className="absolute left-1 right-1 top-[5px] h-[143px] overflow-hidden rounded-[18px]"
      >
        <img src={imageSrc} alt={title} className="h-full w-full object-cover" />
      </div>

      {supportsSpicy ? (
        <div className="absolute left-[9px] top-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#ff2b2e]">
          <img
            src={MOBILE_SHOP_PRODUCT_CARD_ASSETS.hot}
            alt=""
            className="h-[13px] w-[13px] -rotate-[13deg] object-contain"
          />
        </div>
      ) : null}
      {supportsGreens ? (
        <img
          src={MOBILE_SHOP_PRODUCT_CARD_ASSETS.ribbon}
          alt=""
          className={`absolute left-[9px] h-[22px] w-[22px] object-contain ${greensTopClass}`}
        />
      ) : null}

      <div className="absolute left-[9px] top-[150px] flex items-center gap-1.5">
        <img src={MOBILE_SHOP_PRODUCT_CARD_ASSETS.star} alt="" className="h-[19px] w-[19px] object-contain" />
        <p className="text-sm font-medium leading-none text-[rgba(60,47,47,0.62)]">4.7</p>
      </div>

      <div className="absolute left-[9px] top-[172px] w-[118px]">
        <h3 className="text-sm font-bold leading-[1.15] text-[#3c2f2f]">
          <span className="line-clamp-2">{title}</span>
        </h3>
        {category ? (
          <p className="mt-[2px] truncate text-sm font-medium leading-none text-[#a1a1a1]">{category}</p>
        ) : null}
      </div>

      {hasDiscount ? (
        <span className="absolute right-2 top-[152px] inline-flex h-[25px] w-[65px] items-center justify-center rounded-[60px] bg-[#ff7f20] text-xs font-bold leading-none text-black">
          {discountText}
        </span>
      ) : null}

      <div className="absolute right-2 top-[190px] flex max-w-[76px] flex-col items-end gap-0.5 text-right leading-tight">
        <p className={`w-full break-words font-black tabular-nums text-[#3c2f2f] ${priceSizeClass}`}>
          {formattedPrice}
        </p>
        {hasDiscount ? (
          <p
            className={`w-full break-words font-medium tabular-nums text-[#3c2f2f] line-through ${oldPriceSizeClass}`}
          >
            {formattedOldPrice}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAddingToCart || card.inStock === false}
        aria-label={t('common.buttons.addToCart')}
        className="absolute -bottom-[14px] left-1/2 inline-flex h-[42px] w-[42px] -translate-x-1/2 items-center justify-center"
      >
        <img
          src={MOBILE_SHOP_PRODUCT_CARD_ASSETS.addToCart}
          alt=""
          className="h-[42px] w-[42px] object-contain"
        />
      </button>
    </article>
  );
}

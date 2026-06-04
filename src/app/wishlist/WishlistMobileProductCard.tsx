'use client';

import type { MouseEvent } from 'react';
import { StorefrontProductOverlayLink } from '@/components/home/StorefrontProductOverlayLink';
import { formatPrice, type CurrencyCode } from '../../lib/currency';
import { MOBILE_SHOP_PRODUCT_CARD_ASSETS } from '@/constants/mobile-figma-storefront';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import type { WishlistProductCardProduct } from './WishlistProductCard';

const MOBILE_WISHLIST_CARD_HEIGHT_PX = 240;
const MOBILE_WISHLIST_IMAGE_HEIGHT_PX = 143;

/** Figma mobile product card (1:2235) — compact price typography. */
function getWishlistMobilePriceSizeClass(formattedPrice: string): string {
  const length = formattedPrice.length;
  if (length >= 14) {
    return 'text-[11px]';
  }
  if (length >= 11) {
    return 'text-xs';
  }
  return 'text-sm';
}

function resolveDiscountPercent(product: WishlistProductCardProduct): number {
  const fromOriginal =
    product.originalPrice != null &&
    product.originalPrice > product.price &&
    product.originalPrice > 0
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;
  const fromCompare =
    !fromOriginal &&
    product.compareAtPrice != null &&
    product.compareAtPrice > product.price &&
    product.compareAtPrice > 0
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;
  const fromField =
    typeof product.discountPercent === 'number' && product.discountPercent > 0
      ? Math.round(product.discountPercent)
      : 0;
  return fromOriginal || fromCompare || fromField;
}

function resolveStrikePrice(product: WishlistProductCardProduct): number | null {
  if (product.originalPrice != null && product.originalPrice > product.price) {
    return product.originalPrice;
  }
  if (product.compareAtPrice != null && product.compareAtPrice > product.price) {
    return product.compareAtPrice;
  }
  return null;
}

export interface WishlistMobileProductCardProps {
  product: WishlistProductCardProduct;
  currency: CurrencyCode;
  isAddingToCart: boolean;
  onRemove: (productId: string) => void;
  onAddToCart: (product: WishlistProductCardProduct) => void;
  t: (key: string) => string;
}

/**
 * Mobile wishlist tile — cream Figma layout (shop parity, node 1:2235).
 */
export function WishlistMobileProductCard({
  product,
  currency,
  isAddingToCart,
  onRemove,
  onAddToCart,
  t,
}: WishlistMobileProductCardProps) {
  const productHref = `/products/${product.slug}`;
  const imageSrc = resolveStorefrontProductImage(product.image);
  const formattedPrice = formatPrice(product.price, currency);
  const strikePrice = resolveStrikePrice(product);
  const formattedStrikePrice =
    strikePrice != null ? formatPrice(strikePrice, currency) : null;
  const priceSizeClass = getWishlistMobilePriceSizeClass(formattedPrice);
  const strikePriceSizeClass =
    formattedStrikePrice != null
      ? getWishlistMobilePriceSizeClass(formattedStrikePrice)
      : priceSizeClass;
  const discountPercent = resolveDiscountPercent(product);
  const hasDiscount = discountPercent > 0;
  const discountText = hasDiscount ? `-${discountPercent}%` : '';

  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove(product.id);
  };

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onAddToCart(product);
  };

  return (
    <article
      data-wishlist-mobile-card
      className="relative w-full cursor-pointer rounded-[20px] bg-[#ffeacc]"
      style={{ height: MOBILE_WISHLIST_CARD_HEIGHT_PX }}
    >
      <StorefrontProductOverlayLink slug={product.slug} label={product.title} />
      <div
        className={`absolute left-1 right-1 top-[5px] overflow-hidden rounded-[18px] ${
          product.inStock ? '' : 'opacity-70'
        }`}
        style={{ height: MOBILE_WISHLIST_IMAGE_HEIGHT_PX }}
      >
        <img src={imageSrc} alt={product.title} className="h-full w-full object-cover" />
        {!product.inStock ? (
          <span className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 text-xs font-bold uppercase tracking-wide text-white">
            {t('common.stock.outOfStock')}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleRemove}
        className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/95 text-gray-600 shadow-md transition-colors hover:bg-white hover:text-gray-900 active:scale-95"
        aria-label={t('common.ariaLabels.removeFromWishlist')}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute left-[9px] top-[150px] w-[calc(100%-18px)] pr-[72px]">
        <h3 className="text-sm font-bold leading-[1.15] text-[#3c2f2f]">
          <span className="line-clamp-2">{product.title}</span>
        </h3>
      </div>

      {hasDiscount ? (
        <span className="absolute right-2 top-[152px] inline-flex h-[25px] min-w-[52px] max-w-[72px] items-center justify-center rounded-[60px] bg-[#ff7f20] px-2 text-xs font-bold leading-none text-black">
          {discountText}
        </span>
      ) : null}

      <div className="absolute right-2 top-[190px] flex max-w-[76px] flex-col items-end gap-0.5 text-right leading-tight">
        <p className={`w-full break-words font-black tabular-nums text-[#3c2f2f] ${priceSizeClass}`}>
          {formattedPrice}
        </p>
        {hasDiscount && formattedStrikePrice != null ? (
          <p
            className={`w-full break-words font-medium tabular-nums text-[#3c2f2f] line-through ${strikePriceSizeClass}`}
          >
            {formattedStrikePrice}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!product.inStock || isAddingToCart}
        aria-label={
          isAddingToCart ? t('common.messages.adding') : t('common.buttons.addToCart')
        }
        className="absolute -bottom-[14px] left-1/2 inline-flex h-[42px] w-[42px] -translate-x-1/2 items-center justify-center disabled:cursor-not-allowed disabled:opacity-45"
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

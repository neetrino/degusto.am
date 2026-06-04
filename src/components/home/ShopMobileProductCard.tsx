'use client';

import { useCallback, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';
import { useCurrency } from '../hooks/useCurrency';
import { formatPrice } from '../../lib/currency';
import { useAddToCart } from '../hooks/useAddToCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../../lib/auth/AuthContext';
import { WishlistHeartIcon } from '../icons/WishlistHeartIcon';
import {
  FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS,
  MOBILE_SHOP_PRODUCT_CARD_ASSETS,
} from '@/constants/mobile-figma-storefront';
import {
  getProductCardWishlistHoverClasses,
  PRODUCT_CARD_CART_BTN_HOVER_CLASS,
  PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS,
  PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS,
} from '@/constants/product-card-action-hover';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import { HomeOptimizedImage } from './HomeOptimizedImage';
import { StorefrontProductOverlayLink } from './StorefrontProductOverlayLink';
import { usePrefetchProductWhenVisible } from '../hooks/usePrefetchProductWhenVisible';
import { prefetchProductRoute } from '@/lib/products/prefetch-product-route';
import { PRODUCT_CARD_INTERACTIVE_Z_CLASS } from '@/constants/product-card-stacking';
import { shouldShowMenuCardStrikethroughPrice } from '@/lib/storefront/menu-card-pricing';
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
  const { isLoggedIn } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist(card.id);
  const title = card.title || (card.titleKey ? t(card.titleKey) : '');
  const category = card.category || (card.categoryKey ? t(card.categoryKey) : '');
  const imageSrc = resolveStorefrontProductImage(card.image);
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
  const showStrikethroughPrice = shouldShowMenuCardStrikethroughPrice(card.price, card.oldPrice);
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
    title,
    image: card.image ?? imageSrc,
  });

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget as HTMLElement;
    const cardRoot = button.closest('[data-home-product-card]');
    const origin =
      (cardRoot?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    void addToCart({ origin, imageUrl: resolveStorefrontProductImage(card.image) });
  };

  const handleWishlistToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(productHref)}`);
      return;
    }
    void toggleWishlist();
  };

  const visibilityRef = usePrefetchProductWhenVisible(card.slug);
  const warmProductRoute = useCallback(() => {
    prefetchProductRoute(router, card.slug);
  }, [router, card.slug]);

  return (
    <article
      ref={visibilityRef}
      data-home-product-card
      className={`relative h-[240px] w-full cursor-pointer rounded-[20px] border-[1.5px] border-[#dedede] bg-white transition-colors ${FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS}`}
      onMouseEnter={warmProductRoute}
      onFocus={warmProductRoute}
      onPointerDown={warmProductRoute}
      onTouchStart={warmProductRoute}
    >
      <div
        data-product-fly-origin
        className="absolute left-1 right-1 top-[5px] h-[143px] overflow-hidden rounded-[18px] relative"
      >
        <HomeOptimizedImage
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
          loading="lazy"
          sizes="50vw"
        />
      </div>

      <button
        type="button"
        onClick={handleWishlistToggle}
        className={`absolute right-2 top-2 ${PRODUCT_CARD_INTERACTIVE_Z_CLASS} flex h-8 w-8 items-center justify-center rounded-full border shadow-md ${PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS} ${getProductCardWishlistHoverClasses(isInWishlist)} ${
          isInWishlist
            ? 'border-red-600 bg-red-600 text-white'
            : 'border-[#dedede]/90 bg-white/95 text-gray-700'
        }`}
        title={
          isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')
        }
        aria-label={
          isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')
        }
      >
        <span className={PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS} aria-hidden>
          <WishlistHeartIcon filled={isInWishlist} size={16} />
        </span>
      </button>

      {supportsSpicy ? (
        <div className="absolute left-[9px] top-[11px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#ff2b2e]">
          <HomeOptimizedImage
            src={MOBILE_SHOP_PRODUCT_CARD_ASSETS.hot}
            alt=""
            width={13}
            height={13}
            className="h-[13px] w-[13px] -rotate-[13deg] object-contain"
            loading="lazy"
          />
        </div>
      ) : null}
      {supportsGreens ? (
        <HomeOptimizedImage
          src={MOBILE_SHOP_PRODUCT_CARD_ASSETS.ribbon}
          alt=""
          width={22}
          height={22}
          className={`absolute left-[9px] h-[22px] w-[22px] object-contain ${greensTopClass}`}
          loading="lazy"
        />
      ) : null}

      <div className="absolute left-[9px] top-[150px] flex items-center gap-1.5">
        <HomeOptimizedImage
          src={MOBILE_SHOP_PRODUCT_CARD_ASSETS.star}
          alt=""
          width={19}
          height={19}
          className="h-[19px] w-[19px] object-contain"
          loading="lazy"
        />
        <p className="text-sm font-medium leading-none text-[rgba(60,47,47,0.62)]">4.7</p>
      </div>

      <div className="absolute left-[9px] top-[172px] w-[118px]">
        <h3 className="text-sm font-bold leading-[1.15] text-[#3c2f2f]">
          <span className="line-clamp-2">{title}</span>
        </h3>
        {category ? (
          <p className="mt-[2px] truncate text-sm font-medium leading-[1.2] text-[#a1a1a1]">{category}</p>
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
        {showStrikethroughPrice ? (
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
        className={`absolute -bottom-[14px] left-1/2 ${PRODUCT_CARD_INTERACTIVE_Z_CLASS} inline-flex h-[42px] w-[42px] -translate-x-1/2 items-center justify-center disabled:opacity-50 ${PRODUCT_CARD_CART_BTN_HOVER_CLASS}`}
      >
        <HomeOptimizedImage
          src={MOBILE_SHOP_PRODUCT_CARD_ASSETS.addToCart}
          alt=""
          width={42}
          height={42}
          className="h-[42px] w-[42px] object-contain"
          loading="lazy"
        />
      </button>
      <StorefrontProductOverlayLink slug={card.slug} label={title} />
    </article>
  );
}

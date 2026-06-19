import Link from 'next/link';
import { memo, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { useCurrency } from '../../hooks/useCurrency';
import { formatPrice } from '../../../lib/currency';
import { useAddToCart } from '../../hooks/useAddToCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../../lib/auth/AuthContext';
import { WishlistHeartIcon } from '../../icons/WishlistHeartIcon';
import { resolveStorefrontProductImage, STOREFRONT_PRODUCT_IMAGE_PATH } from '@/constants/storefront-product-image';
import { HomeProductFoodAttributeBadges } from '../HomeProductFoodAttributeBadges';
import { StorefrontProductOverlayLink } from '../StorefrontProductOverlayLink';
import { usePrefetchProductWhenVisible } from '../../hooks/usePrefetchProductWhenVisible';
import { prefetchProductRoute } from '@/lib/products/prefetch-product-route';
import type { MenuCard } from '../menu-types';
import {
  FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS,
} from '@/constants/mobile-figma-storefront';
import {
  getProductCardWishlistHoverClasses,
  PRODUCT_CARD_CART_BTN_HOVER_CLASS,
  PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS,
  PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS,
} from '@/constants/product-card-action-hover';
import { shouldShowMenuCardStrikethroughPrice } from '@/lib/storefront/menu-card-pricing';
import { HomeOptimizedImage } from '../HomeOptimizedImage';
import { SHOP_DESKTOP_PRODUCT_IMAGE_SIZES } from '@/constants/shop-menu-perf';
import { createProductPreviewSummary } from '@/lib/products/product-preview';
import { resolveMenuCardCategoryLabel } from '@/lib/storefront/menu-card-category-label';
import { RatingStars } from '@/components/RatingStars';
import { SHOP_MENU_ASSETS } from './shop-menu-assets';
import { menuCardToWishlistSnapshot } from '@/lib/wishlist/wishlist-product-snapshot-mappers';

const DESKTOP_MENU_CARD_HEIGHT_CLASS = 'h-[330px]';
const DESKTOP_MENU_CARD_META_TOP_CLASS = 'top-[215px]';
const DESKTOP_MENU_CARD_TITLE_TOP_CLASS = 'top-[239px]';
const DESKTOP_MENU_CARD_PRICE_TOP_CLASS = 'top-[282px]';
const DESKTOP_MENU_CARD_COMPARE_PRICE_TOP_CLASS = 'top-[308px]';
const DESKTOP_MENU_CARD_IMAGE_FRAME_CLASS =
  'relative mx-auto mt-1 h-[180px] w-[calc(100%-10px)]';

function FigmaDesktopShopMenuCardItemBase({
  card,
  imagePriority = false,
}: {
  card: MenuCard;
  imagePriority?: boolean;
}) {
  const { t, lang } = useTranslation();
  const currency = useCurrency();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist(card.id);
  const title = card.title || (card.titleKey ? t(card.titleKey) : '');
  const category = resolveMenuCardCategoryLabel(card, t, lang);
  const imageSrc = resolveStorefrontProductImage(card.image);
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
    void toggleWishlist(menuCardToWishlistSnapshot(card, title));
  };

  const visibilityRef = usePrefetchProductWhenVisible(card.slug);
  const displayRating = card.rating ?? 5;
  const effectiveDisplayRating = displayRating > 0 ? displayRating : 5;
  const previewSummary = createProductPreviewSummary({
    id: card.id,
    slug: card.slug,
    title,
    image: imageSrc,
    price: card.price,
    oldPrice: showStrikethroughPrice ? card.oldPrice : null,
    discount: hasDiscount ? effectiveDiscountPercent : null,
    category: null,
    rating: displayRating > 0 ? displayRating : 5,
    currency,
    inStock: card.inStock ?? true,
    defaultVariantId: card.defaultVariantId ?? null,
  });
  const warmProductRoute = useCallback(() => {
    prefetchProductRoute(router, card.slug);
  }, [router, card.slug]);

  return (
    <article
      ref={visibilityRef}
      data-home-product-card
      className={`relative ${DESKTOP_MENU_CARD_HEIGHT_CLASS} w-full shrink-0 cursor-pointer rounded-[20px] border-[1.5px] border-[#dedede] bg-white transition-colors ${FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS} hover:shadow-md`}
      onMouseEnter={warmProductRoute}
      onFocus={warmProductRoute}
      onPointerDown={warmProductRoute}
      onTouchStart={warmProductRoute}
    >
      <StorefrontProductOverlayLink slug={card.slug} label={title} preview={previewSummary} />
      <div className={DESKTOP_MENU_CARD_IMAGE_FRAME_CLASS}>
        <div data-product-fly-origin className="h-full w-full overflow-hidden rounded-[20px]">
          <HomeOptimizedImage
            src={imageSrc}
            alt={title}
            fill
            className="h-full w-full rounded-[20px] object-cover"
            sizes={SHOP_DESKTOP_PRODUCT_IMAGE_SIZES}
            priority={imagePriority}
            loading={imagePriority ? 'eager' : 'lazy'}
            fallbackSrc={STOREFRONT_PRODUCT_IMAGE_PATH}
          />
        </div>
        <HomeProductFoodAttributeBadges
          variant="desktop-card"
          supportsSpicy={card.supportsSpicy ?? false}
          supportsGreens={card.supportsGreens ?? false}
          hotIconSrc={SHOP_MENU_ASSETS.productCardHot}
          greensIconSrc={SHOP_MENU_ASSETS.productCardRibbon}
        />
        <button
          type="button"
          onClick={handleWishlistToggle}
          className={`absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-md sm:h-10 sm:w-10 ${PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS} ${getProductCardWishlistHoverClasses(isInWishlist)} ${
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
            <WishlistHeartIcon filled={isInWishlist} size={18} />
          </span>
        </button>
      </div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAddingToCart || (card.inStock === false)}
        aria-label={t('common.buttons.addToCart')}
        className={`absolute -bottom-[25px] left-1/2 z-20 inline-flex h-[52px] w-[51px] -translate-x-1/2 items-center justify-center disabled:opacity-50 ${PRODUCT_CARD_CART_BTN_HOVER_CLASS}`}
      >
        <img src={SHOP_MENU_ASSETS.productCardAddToCart} alt="" className="h-[52px] w-[51px] object-contain" />
      </button>
      <div className={`absolute left-[14px] ${DESKTOP_MENU_CARD_META_TOP_CLASS} flex items-center gap-[6px]`}>
        <RatingStars
          rating={effectiveDisplayRating / 5}
          starSrc={SHOP_MENU_ASSETS.productCardStar}
          className="flex items-center"
          starClassName="h-4 w-4"
          maxStars={1}
        />
        <p className="text-base font-medium leading-[1.35] text-[rgba(60,47,47,0.62)]">
          {effectiveDisplayRating.toFixed(1)}
        </p>
      </div>
      <div className={`absolute left-[14px] right-[100px] ${DESKTOP_MENU_CARD_TITLE_TOP_CLASS} min-w-0`}>
        <h3 className="text-base font-bold leading-[1.05] text-[#3c2f2f]">
          <span className="block max-h-[34px] overflow-hidden break-words">{title}</span>
        </h3>
        {category ? (
          <p className="mt-1 truncate text-base font-medium leading-[1.2] text-[#a1a1a1]">{category}</p>
        ) : null}
      </div>
      {hasDiscount ? (
        <span className={`absolute right-px ${DESKTOP_MENU_CARD_META_TOP_CLASS} inline-flex h-[30px] items-center rounded-[60px] bg-[#ff7f20] px-[17px] text-sm font-bold leading-none text-black`}>
          {discountText}
        </span>
      ) : null}
      <p className={`absolute right-[14px] ${DESKTOP_MENU_CARD_PRICE_TOP_CLASS} text-[20px] font-black leading-none text-[#3c2f2f]`}>{formatPrice(card.price, currency)}</p>
      {showStrikethroughPrice ? (
        <p className={`absolute right-[14px] ${DESKTOP_MENU_CARD_COMPARE_PRICE_TOP_CLASS} text-sm font-light leading-none text-[#3c2f2f] line-through`}>
          {formatPrice(card.oldPrice, currency)}
        </p>
      ) : null}
    </article>
  );
}

export const FigmaDesktopShopMenuCardItem = memo(FigmaDesktopShopMenuCardItemBase);

'use client';

import type { MouseEvent } from 'react';
import { CompareIcon } from '../icons/CompareIcon';
import { CartIcon as CartPngIcon } from '../icons/CartIcon';
import { WishlistHeartIcon } from '../icons/WishlistHeartIcon';
import { useTranslation } from '../../lib/i18n-client';
import {
  getProductCardWishlistHoverClasses,
  PRODUCT_CARD_CART_INLINE_BTN_HOVER_CLASS,
  PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS,
  PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS,
} from '@/constants/product-card-action-hover';

interface ProductCardActionsProps {
  isInWishlist: boolean;
  isInCompare: boolean;
  isAddingToCart: boolean;
  inStock: boolean;
  isCompact?: boolean;
  onWishlistToggle: (e: MouseEvent) => void;
  onCompareToggle: (e: MouseEvent) => void;
  onAddToCart: (e: MouseEvent) => void;
  showOnHover?: boolean;
  /** When false, wishlist is rendered elsewhere (e.g. fixed on image). Default true. */
  showWishlist?: boolean;
}

/**
 * Component for product action buttons (wishlist, compare, cart)
 */
export function ProductCardActions({
  isInWishlist,
  isInCompare,
  isAddingToCart,
  inStock,
  isCompact = false,
  onWishlistToggle,
  onCompareToggle,
  onAddToCart,
  showOnHover = false,
  showWishlist = true,
}: ProductCardActionsProps) {
  const { t } = useTranslation();
  const iconSize = isCompact ? 18 : 24;
  const buttonSize = isCompact ? 'w-10 h-10' : 'w-12 h-12';

  const hoverCornerClass =
    showOnHover && !showWishlist
      ? isCompact
        ? 'top-[3.25rem] right-1.5'
        : 'top-16 right-3'
      : isCompact
        ? 'top-1.5 right-1.5'
        : 'top-3 right-3';

  const actions = (
    <>
      {/* Compare Icon */}
      <button
        onClick={onCompareToggle}
        className={`${buttonSize} rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          isInCompare
            ? 'border-gray-900 text-gray-900 bg-white shadow-sm'
            : 'border-gray-200 text-gray-700 bg-white hover:border-gray-300 hover:bg-gray-50'
        }`}
        title={isInCompare ? t('common.messages.removedFromCompare') : t('common.messages.addedToCompare')}
        aria-label={isInCompare ? t('common.ariaLabels.removeFromCompare') : t('common.ariaLabels.addToCompare')}
      >
        <CompareIcon isActive={isInCompare} size={isCompact ? 16 : 18} />
      </button>

      {showWishlist ? (
        <button
          type="button"
          onClick={onWishlistToggle}
          className={`${buttonSize} rounded-full flex items-center justify-center transition-all duration-200 ${PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS} ${getProductCardWishlistHoverClasses(isInWishlist)} ${
            isInWishlist
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-white text-gray-700 shadow-md'
          }`}
          title={isInWishlist ? t('common.messages.removedFromWishlist') : t('common.messages.addedToWishlist')}
          aria-label={
            isInWishlist ? t('common.ariaLabels.removeFromWishlist') : t('common.ariaLabels.addToWishlist')
          }
        >
          <span className={PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS} aria-hidden>
            <WishlistHeartIcon filled={isInWishlist} size={isCompact ? 18 : 20} />
          </span>
        </button>
      ) : null}
    </>
  );

  if (showOnHover) {
    return (
      <div
        className={`absolute ${hoverCornerClass} flex flex-col ${isCompact ? 'gap-1.5' : 'gap-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10`}
      >
        {actions}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {actions}
      {/* Cart Icon */}
      <button
        onClick={onAddToCart}
        disabled={!inStock || isAddingToCart}
        className={`${buttonSize} rounded-full flex items-center justify-center transition-all duration-200 ${PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS} ${
          inStock && !isAddingToCart
            ? `bg-transparent text-gray-600 ${PRODUCT_CARD_CART_INLINE_BTN_HOVER_CLASS}`
            : 'bg-transparent text-gray-400 cursor-not-allowed'
        }`}
        title={inStock ? t('common.buttons.addToCart') : t('common.stock.outOfStock')}
        aria-label={inStock ? t('common.ariaLabels.addToCart') : t('common.ariaLabels.outOfStock')}
      >
        {isAddingToCart ? (
          <svg className={`animate-spin ${isCompact ? 'h-5 w-5' : 'h-6 w-6'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <CartPngIcon size={iconSize} />
        )}
      </button>
    </div>
  );
}





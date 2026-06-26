/** Shared pointer + spring transition for product card icon buttons. */
export const PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS =
  'group cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none';

/** Wishlist button — empty state hover glow. */
export const PRODUCT_CARD_WISHLIST_BTN_IDLE_HOVER_CLASS =
  'hover:scale-110 hover:border-red-300 hover:bg-red-50 hover:text-red-500 hover:shadow-[0_4px_14px_rgba(239,68,68,0.35)] active:scale-95';

/** Wishlist button — filled state hover glow. */
export const PRODUCT_CARD_WISHLIST_BTN_FILLED_HOVER_CLASS =
  'hover:scale-110 hover:bg-red-700 hover:shadow-[0_4px_14px_rgba(220,38,38,0.45)] active:scale-95';

/** Heart icon pulse when the parent wishlist button is hovered. */
export const PRODUCT_CARD_WISHLIST_ICON_HOVER_CLASS =
  'transition-transform duration-300 group-hover:animate-product-card-heart-beat motion-reduce:group-hover:animate-none';

/** Floating cart button (PNG circle at card bottom). */
export const PRODUCT_CARD_CART_BTN_HOVER_CLASS =
  'cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-translate-y-1.5 active:scale-95 active:translate-y-0 disabled:hover:scale-100 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0';

/** Inline cart icon button (catalog grid/list actions). */
export const PRODUCT_CARD_CART_INLINE_BTN_HOVER_CLASS =
  'hover:scale-110 hover:bg-green-600 hover:text-white active:scale-95';

/**
 * Resolves wishlist hover classes based on saved state.
 */
export function getProductCardWishlistHoverClasses(isInWishlist: boolean): string {
  return isInWishlist
    ? PRODUCT_CARD_WISHLIST_BTN_FILLED_HOVER_CLASS
    : PRODUCT_CARD_WISHLIST_BTN_IDLE_HOVER_CLASS;
}

/** Compare button — idle state hover glow. */
export const PRODUCT_CARD_COMPARE_BTN_IDLE_HOVER_CLASS =
  'hover:scale-110 hover:border-[#ff7f20]/40 hover:bg-orange-50 hover:text-[#ff7f20] hover:shadow-[0_4px_14px_rgba(255,127,32,0.3)] active:scale-95';

/** Compare button — active state hover glow. */
export const PRODUCT_CARD_COMPARE_BTN_FILLED_HOVER_CLASS =
  'hover:scale-110 hover:bg-[#e56f10] hover:shadow-[0_4px_14px_rgba(255,127,32,0.45)] active:scale-95';

export function getProductCardCompareHoverClasses(isInCompare: boolean): string {
  return isInCompare
    ? PRODUCT_CARD_COMPARE_BTN_FILLED_HOVER_CLASS
    : PRODUCT_CARD_COMPARE_BTN_IDLE_HOVER_CLASS;
}

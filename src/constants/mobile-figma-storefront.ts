import { HEADER_PUBLIC_ASSETS } from '@/constants/header-public-assets';
import { r2Asset } from '@/lib/r2-public-url';

/**
 * Shared mobile storefront chrome (Figma home parity): assets + layout tokens.
 * Keep in sync with `FigmaHomePageMobile` visual structure.
 */
export const MOBILE_FIGMA_STOREFRONT_ASSETS = {
  logo: HEADER_PUBLIC_ASSETS.mobileLogo,
  callCircle: r2Asset('assets/20260512-oiO5lHqN_7.svg'),
  callIcon: r2Asset('icons/20260512-EM1Vpadi-M.svg'),
  switcherIcon: HEADER_PUBLIC_ASSETS.switcherIcon,
  searchIcon: HEADER_PUBLIC_ASSETS.searchIcon,
  searchFilterButton: r2Asset('search/20260512-X-wm1R4kZC.svg'),
} as const;

/** Header stacking: language dropdown above main + bottom nav. */
export const MOBILE_FIGMA_HEADER_STACKING_CLASS = 'z-[100]';

/** Logo / call / language row — above search bar. */
export const MOBILE_FIGMA_HEADER_TOP_ROW_STACKING_CLASS = 'z-20';

/** Mobile header search bar — behind top row and language menu. */
export const MOBILE_FIGMA_HEADER_SEARCH_STACKING_CLASS = 'z-0';

/** Mobile header search autocomplete — above search bar, below language menu. */
export const MOBILE_FIGMA_HEADER_SEARCH_RESULTS_STACKING_CLASS = 'z-10';

/** Language / currency trigger while menu is open (mobile). */
export const MOBILE_FIGMA_HEADER_SWITCHER_OPEN_STACKING_CLASS = 'z-30';

/** Language / currency popup — topmost header layer. */
export const MOBILE_FIGMA_HEADER_SWITCHER_DROPDOWN_STACKING_CLASS = 'z-40';

/** Horizontal inset for logo row + search (matches home). */
export const MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS = 'px-4';

/** Debounced URL writes for shop/combo search (aligns with menu page). */
export const MOBILE_STORE_MENU_SEARCH_URL_DEBOUNCE_MS = 250;

/** Bottom inset inside white surface so content clears fixed bottom nav. */
export const MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS = 'pb-[110px]';

/** Scroll target for mobile header filter control on shop/combo. */
export const MOBILE_STOREFRONT_FILTERS_ANCHOR_ID = 'mobile-storefront-filters-anchor';

/** Product grid on mobile shop/combo category views (2 columns, Figma 1:2235). */
export const MOBILE_SHOP_PRODUCTS_GRID_CLASS = 'grid grid-cols-2 gap-x-[14px] gap-y-[22px]';

/** Figma product card cream surface (#FFEACC) — mobile default, desktop/catalog hover. */
export const FIGMA_PRODUCT_CARD_CREAM_BG_CLASS = 'bg-[#FFEACC]';
export const FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS = 'hover:bg-[#FFEACC]';
export const FIGMA_PRODUCT_CARD_CREAM_GROUP_HOVER_CLASS = 'group-hover:bg-[#FFEACC]';

/** Mobile shop product card artwork (Figma 1:2235 / home mobile parity). */
export const MOBILE_SHOP_PRODUCT_CARD_ASSETS = {
  fallbackImage: r2Asset('product/20260512-lbgLHc4bPu.png'),
  addToCart: r2Asset('product/20260512-N6b8G5qARR.svg'),
  hot: r2Asset('product/20260512-Y6Ue4PwD26.svg'),
  ribbon: r2Asset('product/20260512-vCDQ1I3ZtJ.svg'),
  star: r2Asset('product/20260512-4fThctFUPS.svg'),
} as const;

import { STOREFRONT_PRODUCT_IMAGE_PATH } from '@/constants/storefront-product-image';
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

/**
 * Page content inside {@link MobileStorefrontChrome} — full width; chrome already applies horizontal inset.
 * Do not reuse desktop shell classes here (they add a second max-width + padding pass).
 */
export const MOBILE_STOREFRONT_PAGE_SECTION_CLASS = 'w-full';

/** Debounced URL writes for shop/combo search (aligns with menu page). */
export const MOBILE_STORE_MENU_SEARCH_URL_DEBOUNCE_MS = 250;

/** Bottom inset inside white surface so content clears fixed bottom nav. */
export const MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS = 'pb-[110px]';

/** Scroll target for mobile header filter control on shop/combo. */
export const MOBILE_STOREFRONT_FILTERS_ANCHOR_ID = 'mobile-storefront-filters-anchor';

/** Product grid on mobile shop/combo category views (2 columns, Figma 1:2235). */
export const MOBILE_SHOP_PRODUCTS_GRID_CLASS = 'grid grid-cols-2 gap-x-[14px] gap-y-[30px]';

/** Mobile shop category picker grid (Figma categories screen). */
export const MOBILE_SHOP_CATEGORY_GRID_CLASS = 'mt-4 grid grid-cols-2 gap-x-3 gap-y-[14px]';

/** Dark category card shell — food photo fills lower area. */
export const MOBILE_SHOP_CATEGORY_CARD_CLASS =
  'relative block h-[183px] overflow-hidden rounded-[28px] bg-[#090909] text-left transition-opacity active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66a13]';

/** Category food photo — bottom crop per Figma card layout. */
export const MOBILE_SHOP_CATEGORY_CARD_IMAGE_CLASS =
  'pointer-events-none absolute inset-x-0 bottom-0 h-[134px] overflow-hidden rounded-b-[28px]';

/** Figma product card cream surface (#FFEACC) — mobile default, desktop/catalog hover. */
export const FIGMA_PRODUCT_CARD_CREAM_BG_CLASS = 'bg-[#FFEACC]';
export const FIGMA_PRODUCT_CARD_CREAM_HOVER_CLASS = 'hover:bg-[#FFEACC]';
export const FIGMA_PRODUCT_CARD_CREAM_GROUP_HOVER_CLASS = 'group-hover:bg-[#FFEACC]';

/** Figma 1:1650 — daily offer card gradient (Frame 71, 356×128). */
export const MOBILE_HOME_DAILY_OFFER_GRADIENT_CLASS =
  'bg-gradient-to-r from-[#FF7A00] to-[#F3C4A5]';

/** Figma 1:1651 — product photo on daily offer card (left 176px / width 184px on 356px frame). */
export const MOBILE_HOME_DAILY_OFFER_PHOTO_LAYOUT_CLASS =
  'absolute top-0 left-[49.44%] h-full w-[51.69%]';

/** Mobile shop product card artwork (Figma 1:2235 / home mobile parity). */
export const MOBILE_SHOP_PRODUCT_CARD_ASSETS = {
  productImage: STOREFRONT_PRODUCT_IMAGE_PATH,
  addToCart: r2Asset('product/20260512-N6b8G5qARR.svg'),
  hot: r2Asset('product/20260512-Y6Ue4PwD26.svg'),
  ribbon: r2Asset('product/20260512-vCDQ1I3ZtJ.svg'),
  star: r2Asset('product/20260512-4fThctFUPS.svg'),
} as const;

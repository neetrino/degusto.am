/**
 * Shared mobile storefront chrome (Figma home parity): assets + layout tokens.
 * Keep in sync with `FigmaHomePageMobile` visual structure.
 */
export const MOBILE_FIGMA_STOREFRONT_ASSETS = {
  logo: '/api/r2/logo/20260512-SkrFbnskhy.png',
  callCircle: '/api/r2/assets/20260512-oiO5lHqN_7.svg',
  callIcon: '/api/r2/icons/20260512-EM1Vpadi-M.svg',
  switcherIcon: '/api/r2/icons/20260512-qZTYh7B1Ko.svg',
  switcherArrow: '/api/r2/assets/20260512-XFFAtVhXmC.svg',
  searchIcon: '/api/r2/icons/20260512-6InNAfSqmg.svg',
  searchFilterButton: '/api/r2/search/20260512-X-wm1R4kZC.svg',
} as const;

/** Header stacking: language dropdown above main + bottom nav. */
export const MOBILE_FIGMA_HEADER_STACKING_CLASS = 'z-[100]';

/** Horizontal inset for logo row + search (matches home). */
export const MOBILE_FIGMA_HEADER_HORIZONTAL_INSET_CLASS = 'px-4';

/** Debounced URL writes for shop/combo search (aligns with menu page). */
export const MOBILE_STORE_MENU_SEARCH_URL_DEBOUNCE_MS = 250;

/** Bottom inset inside white surface so content clears fixed bottom nav. */
export const MOBILE_STOREFRONT_CHROME_BOTTOM_INSET_CLASS = 'pb-[110px]';

/** Scroll target for mobile header filter control on shop/combo. */
export const MOBILE_STOREFRONT_FILTERS_ANCHOR_ID = 'mobile-storefront-filters-anchor';

/**
 * Storefront desktop layout tokens — one artboard width aligned with {@link UniversalHeader}.
 * Keeps equal left/right margins and consistent horizontal inset across pages.
 */

/** Figma / header reference width (px). */
export const STOREFRONT_DESKTOP_MAX_WIDTH_PX = 1450;

/**
 * Equal viewport side gutters — content never flush to screen edge below ~1510px viewport.
 * Shared by header pill and page sections.
 */
export const STOREFRONT_VIEWPORT_GUTTER_CLASS =
  'w-full max-w-[min(1450px,calc(100%-2rem))] md:max-w-[min(1450px,calc(100%-2.5rem))] lg:max-w-[min(1450px,calc(100%-3rem))]';

/** Horizontally centered shell; equal outer margins when viewport is wider than max width. */
export const STOREFRONT_DESKTOP_SHELL_CLASS = `mx-auto ${STOREFRONT_VIEWPORT_GUTTER_CLASS}`;

/** Standard horizontal inset — matches UniversalHeader `px-4 md:px-6`. */
export const STOREFRONT_DESKTOP_INSET_CLASS = 'px-4 md:px-6';

/** Shell + inset for home, shop, footer, and other padded sections. */
export const STOREFRONT_DESKTOP_SECTION_CLASS = `${STOREFRONT_DESKTOP_SHELL_CLASS} ${STOREFRONT_DESKTOP_INSET_CLASS}`;

/**
 * Shop / combo desktop row — reduced left inset on iPad (lg–xl) so the category sidebar
 * sits closer to the viewport edge; full symmetric inset from 2xl.
 */
export const STOREFRONT_DESKTOP_SHOP_SECTION_CLASS = [
  STOREFRONT_DESKTOP_SHELL_CLASS,
  'pl-2 pr-4 md:pr-6 lg:pl-3 xl:pl-4 2xl:px-6',
].join(' ');

/** Drop-in for legacy `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` storefront containers. */
export const STOREFRONT_PAGE_CONTAINER_CLASS = STOREFRONT_DESKTOP_SECTION_CLASS;

/** Shop / combo main column — shrinks beside sidebar without forcing overflow. */
export const STOREFRONT_DESKTOP_MAIN_COLUMN_CLASS = 'min-w-0 flex-1';

/** Shop / combo sidebar — narrower on iPad desktop, full Figma width from xl. */
export const STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS =
  'w-[min(100%,240px)] shrink-0 lg:w-[240px] xl:w-[280px] 2xl:w-[320px]';

/** Gap between sidebar and main column — tighter below xl. */
export const STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS = 'gap-4 xl:gap-8';

/**
 * Desktop catalog grid — 2 columns when sidebar leaves a narrow main area (lg–xl);
 * 3 columns at xl+ (Figma 30px gap).
 */
export const STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS =
  'grid min-w-0 grid-cols-2 gap-4 xl:grid-cols-3 xl:gap-[30px]';

/** Footer link columns — stacks on tablet desktop, Figma 4-col from xl. */
export const STOREFRONT_DESKTOP_FOOTER_GRID_CLASS =
  'grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-[minmax(0,244px)_minmax(0,283px)_minmax(0,120px)_1fr] xl:gap-10';

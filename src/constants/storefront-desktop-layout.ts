/**
 * Storefront desktop layout tokens — one artboard width aligned with {@link UniversalHeader}.
 * Keeps equal left/right margins and consistent horizontal inset across pages.
 */

/** Figma / header reference width (px). */
export const STOREFRONT_DESKTOP_MAX_WIDTH_PX = 1450;

/** Horizontally centered shell; equal outer margins when viewport is wider than max width. */
export const STOREFRONT_DESKTOP_SHELL_CLASS = 'mx-auto w-full max-w-[1450px]';

/** Standard horizontal inset — matches UniversalHeader `px-4 md:px-6`. */
export const STOREFRONT_DESKTOP_INSET_CLASS = 'px-4 md:px-6';

/** Shell + inset for home, shop, footer, and other padded sections. */
export const STOREFRONT_DESKTOP_SECTION_CLASS = `${STOREFRONT_DESKTOP_SHELL_CLASS} ${STOREFRONT_DESKTOP_INSET_CLASS}`;

/** Shop / combo sidebar column width. */
export const STOREFRONT_DESKTOP_SIDEBAR_WIDTH_CLASS = 'w-[320px]';

/** Gap between sidebar and main column (32px). */
export const STOREFRONT_DESKTOP_SIDEBAR_GAP_CLASS = 'gap-8';

/** Desktop catalog grid — equal horizontal and vertical card gap (Figma 30px). */
export const STOREFRONT_DESKTOP_PRODUCT_GRID_CLASS = 'grid grid-cols-3 gap-[30px]';

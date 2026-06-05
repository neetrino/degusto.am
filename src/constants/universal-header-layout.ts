import { STOREFRONT_DESKTOP_SHELL_CLASS } from '@/constants/storefront-desktop-layout';

/** Inner inset — room from the pill curve (logo / profile not flush to edges). */
export const UNIVERSAL_HEADER_INSET_CLASS = 'px-6 md:px-8 lg:px-10 xl:px-11';

/** Fixed bar height (h-20) + top offset (top-3) — spacer, sticky offsets, hero overlap. */
export const UNIVERSAL_HEADER_SPACER_HEIGHT_PX = 92;

export const UNIVERSAL_HEADER_SPACER_HEIGHT_CLASS = 'h-[92px]';

/** Sticky panels sit just below the fixed bar with a small gap. */
export const UNIVERSAL_HEADER_STICKY_OFFSET_PX = UNIVERSAL_HEADER_SPACER_HEIGHT_PX + 12;

export const UNIVERSAL_HEADER_STICKY_BELOW_BAR_CLASS = 'top-[92px]';

export const UNIVERSAL_HEADER_STICKY_WITH_GAP_CLASS = 'top-[104px]';

/** Shop sidebar — sticky below header with viewport-height fill. */
export const UNIVERSAL_HEADER_STICKY_SIDEBAR_CLASS =
  'sticky top-[104px] flex h-[calc(100vh-120px)]';

export const UNIVERSAL_HEADER_DESKTOP_UNDERLAP_CLASS = 'lg:-mt-[92px] lg:pt-[92px]';

/** Fixed centered bar — same viewport gutters as page sections. */
export const UNIVERSAL_HEADER_POSITION_CLASS = 'fixed left-1/2 top-3 z-50 -translate-x-1/2';

/** Dropdowns / popovers — above header bar paint order; must not clip (bar uses overflow-visible). */
export const UNIVERSAL_HEADER_DROPDOWN_Z_CLASS = 'z-[60]';

/** iPad search modal — above header (z-50), below cart drawer (z-190). */
export const UNIVERSAL_HEADER_SEARCH_POPUP_Z_CLASS = 'z-[100]';
export const UNIVERSAL_HEADER_SEARCH_POPUP_PANEL_Z_CLASS = 'z-[101]';

/**
 * UniversalHeader layout — compact at lg–xl (iPad Pro) to avoid clipping wishlist/actions.
 * Full Figma density from xl (1280px) upward.
 * overflow-visible: profile / lang / search panels extend below the pill on iPad.
 */
export const UNIVERSAL_HEADER_BAR_CLASS = [
  UNIVERSAL_HEADER_POSITION_CLASS,
  'flex h-20 min-w-0 items-center gap-2 overflow-visible',
  'rounded-[120px] border border-white/10 bg-gradient-to-r from-[#0f1017] to-[#13151d] shadow-2xl',
  STOREFRONT_DESKTOP_SHELL_CLASS,
  UNIVERSAL_HEADER_INSET_CLASS,
].join(' ');

/** Primary nav — compact at lg (iPad Pro); full Figma spacing from xl. */
export const UNIVERSAL_HEADER_NAV_CLASS =
  'mr-auto hidden min-w-0 items-center gap-3 whitespace-nowrap text-[15px] font-semibold leading-snug text-white lg:flex xl:ml-6 xl:gap-[30px] xl:text-[18px] xl:leading-[30px]';

/** Search — full pill from xl; lg–xl uses icon + popup (see UniversalHeader). */
export const UNIVERSAL_HEADER_SEARCH_FORM_CLASS =
  'relative ml-auto hidden h-12 w-[237px] shrink items-center overflow-visible rounded-[90px] bg-white p-1 transition-[width] duration-300 ease-out xl:flex xl:focus-within:w-[380px] xl:hover:w-[380px]';

/** iPad desktop — opens search popup on tap. */
export const UNIVERSAL_HEADER_SEARCH_ICON_BTN_CLASS =
  'relative ml-auto hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f66812] lg:inline-flex xl:hidden';

export const UNIVERSAL_HEADER_SEARCH_POPUP_BACKDROP_CLASS =
  'fixed inset-0 bg-black/55 backdrop-blur-[3px]';

export const UNIVERSAL_HEADER_SEARCH_POPUP_PANEL_CLASS =
  'fixed left-1/2 top-[5.75rem] w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 rounded-2xl border border-[#ececec] bg-white p-4 shadow-2xl';

export const UNIVERSAL_HEADER_SEARCH_SUBMIT_CLASS =
  'relative ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[20px] bg-[#f66812] xl:w-auto xl:px-4 xl:py-2';

/** iPad search popup — icon-only submit (no overlapping label). */
export const UNIVERSAL_HEADER_SEARCH_POPUP_SUBMIT_CLASS =
  'relative ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[20px] bg-[#f66812]';

export const UNIVERSAL_HEADER_SEARCH_SUBMIT_LABEL_CLASS =
  'hidden text-[15px] font-semibold leading-6 text-white xl:inline';

export const UNIVERSAL_HEADER_ACTIONS_WRAP_CLASS =
  'relative ml-1 flex shrink-0 items-center gap-1.5 overflow-visible md:ml-2 md:gap-2 xl:ml-3 xl:gap-[11px]';

/** Language / currency — visible from lg (iPad desktop); compact pill until xl. */
export const UNIVERSAL_HEADER_LANG_SWITCHER_WRAP_CLASS = 'hidden shrink-0 overflow-visible lg:block';

/** Figma 1:951 — icon left, pill overlaps from 29px, grows for longer totals. */
export const UNIVERSAL_HEADER_CART_BUTTON_CLASS =
  'relative inline-flex h-12 shrink-0 items-end';

export const UNIVERSAL_HEADER_CART_TOTAL_PILL_CLASS =
  'relative z-[1] -ml-[21px] inline-flex h-12 min-w-[88px] shrink-0 items-center justify-center whitespace-nowrap rounded-[70px] bg-white pl-9 pr-3 text-base font-bold tabular-nums text-black';

export const UNIVERSAL_HEADER_CART_ICON_WRAP_CLASS =
  'relative z-[2] mb-[1px] inline-flex h-[34px] w-[37px] shrink-0 items-center justify-center';

/** Badge sits on the cart icon (Figma 1:957 — ~27px from icon left edge). */
export const UNIVERSAL_HEADER_CART_BADGE_WRAP_CLASS =
  'pointer-events-none absolute left-[27px] top-[-2px] inline-flex h-6 w-6 items-center justify-center';

import { STOREFRONT_DESKTOP_SHELL_CLASS } from '@/constants/storefront-desktop-layout';

/** Inner inset — room from the pill curve (logo / profile not flush to edges). */
export const UNIVERSAL_HEADER_INSET_CLASS = 'px-6 md:px-8 lg:px-10 xl:px-11';

/** Fixed centered bar — same viewport gutters as page sections. */
export const UNIVERSAL_HEADER_POSITION_CLASS = 'fixed left-1/2 top-6 z-50 -translate-x-1/2';

/**
 * UniversalHeader layout — compact at lg–xl (iPad Pro) to avoid clipping wishlist/actions.
 * Full Figma density from xl (1280px) upward.
 */
export const UNIVERSAL_HEADER_BAR_CLASS = [
  UNIVERSAL_HEADER_POSITION_CLASS,
  'flex h-20 min-w-0 items-center gap-2 overflow-hidden',
  'rounded-[120px] border border-white/10 bg-gradient-to-r from-[#0f1017] to-[#13151d] shadow-2xl',
  STOREFRONT_DESKTOP_SHELL_CLASS,
  UNIVERSAL_HEADER_INSET_CLASS,
].join(' ');

/** Primary nav — compact at lg (iPad Pro); full Figma spacing from xl. */
export const UNIVERSAL_HEADER_NAV_CLASS =
  'mr-auto hidden min-w-0 items-center gap-3 whitespace-nowrap text-[15px] font-semibold leading-snug text-white lg:flex xl:ml-6 xl:gap-[30px] xl:text-[18px] xl:leading-[30px]';

/** Search — narrow on tablet desktop; full width + hover expand from xl. */
export const UNIVERSAL_HEADER_SEARCH_FORM_CLASS =
  'relative ml-auto hidden h-12 w-[9.25rem] max-w-[40%] shrink items-center rounded-[90px] bg-white p-1 transition-[width] duration-300 ease-out focus-within:w-[13.5rem] md:flex lg:max-w-none xl:w-[237px] xl:focus-within:w-[380px] xl:hover:w-[380px]';

export const UNIVERSAL_HEADER_SEARCH_SUBMIT_CLASS =
  'relative ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#f66812] xl:w-auto xl:py-2 xl:pl-10 xl:pr-4';

export const UNIVERSAL_HEADER_SEARCH_SUBMIT_LABEL_CLASS =
  'hidden text-[15px] font-semibold leading-6 text-white xl:inline';

export const UNIVERSAL_HEADER_ACTIONS_WRAP_CLASS =
  'ml-1 flex shrink-0 items-center gap-1.5 md:ml-2 md:gap-2 xl:ml-3 xl:gap-[11px]';

/** Language pill is 159px — defer to xl to free space on iPad Pro. */
export const UNIVERSAL_HEADER_LANG_SWITCHER_WRAP_CLASS = 'hidden shrink-0 xl:block';

export const UNIVERSAL_HEADER_CART_BUTTON_WITH_TOTAL_CLASS =
  'relative inline-flex h-12 shrink-0 items-center min-w-[6.75rem] justify-end pl-9 xl:min-w-[117px] xl:pl-10';

export const UNIVERSAL_HEADER_CART_TOTAL_PILL_CLASS =
  'inline-flex h-12 min-w-[4.75rem] items-center justify-center whitespace-nowrap rounded-[70px] bg-white px-2.5 text-sm font-bold tabular-nums text-black xl:min-w-[88px] xl:px-4 xl:text-base';

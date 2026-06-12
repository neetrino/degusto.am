import { STOREFRONT_DESKTOP_SHELL_CLASS } from '@/constants/storefront-desktop-layout';

/** Matches {@link UniversalHeader} content width — keeps PDP image left edge aligned with header. */
export const STOREFRONT_DESKTOP_CONTENT_CLASS = STOREFRONT_DESKTOP_SHELL_CLASS;

/** Figma PDP (node 6:542) design tokens — DEGUSTO DEV 1. */
export const PDP_FIGMA_TEXT = '#3c2f2f';
export const PDP_FIGMA_ORANGE = '#ff7f20';
export const PDP_FIGMA_PILL_BG = '#e4e4e4';
export const PDP_FIGMA_DARK_SECTION = '#121212';
export const PDP_FIGMA_MUTED = '#868686';
export const PDP_FIGMA_PROGRESS_TRACK = '#dbdee1';

export const PDP_MAIN_RADIUS_CLASS = 'lg:rounded-[40px]';
/** Figma node 10:1873 — hero product frame; height follows image + info column. */
export const PDP_HERO_FRAME_CLASS = `${PDP_MAIN_RADIUS_CLASS} w-full max-lg:overflow-visible overflow-hidden bg-white`;
/** Loading shell only — stable min-height to limit CLS before hydration. */
export const PDP_HERO_FRAME_SKELETON_MIN_HEIGHT_CLASS = 'lg:min-h-[44.8125rem]';
/** Gap between hero and related-products dark section on PDP. */
export const PDP_RELATED_SECTION_GAP_CLASS = 'mt-12 lg:mt-20';
/** Figma node 10:1975 — «news» related-products dark section (full viewport width on PDP). */
export const PDP_RELATED_SECTION_RADIUS_CLASS = 'max-lg:rounded-none lg:rounded-[40px]';
/** Break out of storefront shell padding on mobile so the dark block is edge-to-edge. */
export const PDP_RELATED_SECTION_MOBILE_BLEED_CLASS =
  'max-lg:relative max-lg:left-1/2 max-lg:w-screen max-lg:max-w-[100vw] max-lg:-translate-x-1/2';
export const PDP_RELATED_SECTION_CLASS = `w-full ${PDP_RELATED_SECTION_MOBILE_BLEED_CLASS} ${PDP_RELATED_SECTION_RADIUS_CLASS} px-4 pb-10 pt-10 sm:px-8 sm:pb-12 sm:pt-12 lg:static lg:left-auto lg:w-full lg:max-w-none lg:translate-x-0 lg:px-6 lg:pb-12 lg:pt-12 xl:px-12 xl:pb-[77px] xl:pt-[77px] 2xl:px-[82px]`;
/** Carousel pagination — hidden on mobile PDP (swipe only). */
export const PDP_RELATED_CAROUSEL_DOTS_CLASS = 'max-lg:hidden';
/** Active pill on dark related section — orange for contrast vs #121212. */
export const PDP_RELATED_CAROUSEL_DOT_ACTIVE_CLASS = 'w-8 bg-[#ff7f20]';
/** Inactive dots on dark related section. */
export const PDP_RELATED_CAROUSEL_DOT_INACTIVE_CLASS = 'w-2 bg-white/40 hover:bg-white/55';
export const PDP_RELATED_SECTION_MAX_WIDTH_CLASS = 'mx-auto w-full max-w-[91.875rem]';
/** Title bottom → card row (204 − 77 − 72). */
export const PDP_RELATED_HEADER_GAP_CLASS = 'mb-8 lg:mb-[55px]';
/** Figma Frame 169 — horizontal card gap. */
export const PDP_RELATED_CARDS_GAP_CLASS = 'gap-[33px]';
export const PDP_RELATED_TITLE_ACCENT_CLASS =
  'text-[32px] text-[#f66913] sm:text-[48px] lg:text-[60px]';
export const PDP_RELATED_TITLE_MAIN_CLASS =
  'text-[32px] text-white sm:text-[48px] lg:text-[60px]';
/** Figma node 10:1988 — «Ավելին» CTA (140×56). */
export const PDP_RELATED_VIEW_MORE_CLASS =
  '!mt-0 h-14 w-[8.75rem] shrink-0 !rounded-[2.5rem] px-6 py-4 text-base font-bold not-italic leading-6';
/** Figma node 10:1983 — related card product photo offset from card top (Figma 12px → 4px on PDP). */
export const PDP_RELATED_CARD_IMAGE_TOP_CLASS = 'top-1';
/** Figma node 10:661 — price column height; amounts sit toward the bottom. */
export const PDP_RELATED_CARD_PRICE_COLUMN_CLASS =
  'flex min-h-[90px] shrink-0 flex-col items-end text-right';
export const PDP_RELATED_CARD_PRICE_BLOCK_CLASS = 'mt-auto flex flex-col items-end';
/** Figma node 10:662 / 23:614 — related card discount pill (-30%). */
export const PDP_RELATED_CARD_DISCOUNT_BADGE_CLASS =
  'inline-flex h-[30px] min-w-[72px] shrink-0 items-center justify-center rounded-[60px] bg-[#ff7f20] px-3 text-sm font-bold leading-none text-black';
export const PDP_RELATED_CARD_DISCOUNT_BADGE_COMPACT_CLASS =
  'inline-flex h-[25px] shrink-0 items-center justify-center rounded-[60px] bg-[#ff7f20] px-3 text-xs font-bold leading-none text-black';
export const PDP_HERO_FRAME_MAX_WIDTH_CLASS = 'max-w-[86.1875rem]';
export const PDP_HERO_IMAGE_OFFSET_CLASS = 'lg:pt-[1.8125rem]';
/** Same top inset as image; column stretches to image height on desktop. */
export const PDP_HERO_INFO_OFFSET_CLASS =
  'lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:pt-[1.8125rem]';
export const PDP_HERO_COLUMN_GAP_CLASS = 'lg:gap-[47px]';
/** Figma node 10:1872 — main PDP image frame width. */
export const PDP_MAIN_IMAGE_WIDTH = '47.5625rem';
export const PDP_MAIN_IMAGE_MAX_WIDTH_CLASS = 'max-w-[47.5625rem]';
export const PDP_MAIN_IMAGE_GRID_COLUMN_CLASS =
  'lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:grid-cols-[minmax(0,47.5625rem)_minmax(0,1fr)]';
export const PDP_HERO_GRID_CLASS = `grid grid-cols-1 items-start gap-6 max-lg:gap-5 lg:items-stretch ${PDP_MAIN_IMAGE_GRID_COLUMN_CLASS} ${PDP_HERO_COLUMN_GAP_CLASS}`;
/** Mobile — slightly taller frame; desktop Figma 42:25. */
export const PDP_MAIN_IMAGE_ASPECT_CLASS = 'max-lg:aspect-[3/2] aspect-[42/25]';
/** Mobile — full width inside shell; must stay within overflow ancestors. */
export const PDP_MOBILE_MAIN_IMAGE_BLEED_CLASS = 'max-lg:w-full max-lg:min-w-0';
export const PDP_IMAGE_RADIUS_CLASS = 'rounded-[2.125rem]';
export const PDP_PILL_RADIUS_CLASS = 'rounded-[70px]';
/** Customization ingredient dropdown — above hero frame, header, and action row. */
export const PDP_CUSTOMIZATION_DROPDOWN_Z_CLASS = 'z-[9999]';
/** Gap between pill trigger and portaled dropdown (px). */
export const PDP_CUSTOMIZATION_DROPDOWN_OFFSET_PX = 8;
/** Max width of portaled customization dropdown (matches add-to-cart pill). */
export const PDP_CUSTOMIZATION_DROPDOWN_MAX_WIDTH_REM = 16.25;
/** Figma node 10:1953 — «Ավելացնել» customization pill. */
export const PDP_CUSTOMIZATION_ADD_PILL_CLASS = 'h-[3rem] w-[12.1875rem]';
/** Figma node 10:1958 — «Բացառել» customization pill. */
export const PDP_CUSTOMIZATION_EXCLUDE_PILL_CLASS = 'h-[3rem] w-[10.9375rem]';
export const PDP_CUSTOMIZATION_PILL_HEIGHT_CLASS = 'h-[3rem]';
/** Figma node 10:1874 — product title (pair with {@link montserratArmFont}). */
export const PDP_TITLE_CLASS =
  'mb-2 break-words text-[2.25rem] font-[700] not-italic leading-normal text-[#3C2F2F]';
/** Figma node 10:1889 — product description body. */
export const PDP_DESCRIPTION_CLASS =
  "mb-5 max-w-[31.125rem] font-['Montserrat_arm','Montserrat',sans-serif] text-base font-normal leading-6 text-[#3c2f2f] [&_a]:text-[#ff7f20] [&_a]:underline [&_li]:leading-6 [&_p]:leading-6 [&_p]:text-[#3c2f2f]";
/** Mobile PDP — compact horizontal inset; no negative margin (avoids overflow clip). */
export const PDP_MOBILE_SHELL_BLEED_CLASS =
  'max-lg:px-1 max-lg:py-4 sm:max-lg:px-2';
export const PDP_MOBILE_HERO_INSET_CLASS = 'max-lg:p-0';
/** Shared PDP content shell (hero + below-fold on mobile). */
export const PDP_CONTENT_SHELL_CLASS = `${STOREFRONT_DESKTOP_CONTENT_CLASS} relative z-10 ${PDP_MOBILE_SHELL_BLEED_CLASS} lg:px-0 lg:py-10`;
/** Figma node 10:1884 — PDP rating star row. */
export const PDP_RATING_STAR_SIZE_CLASS = 'max-lg:size-5 lg:size-[28px]';
export const PDP_RATING_STAR_GAP_CLASS = 'max-lg:gap-[3px] lg:gap-[5px]';
export const PDP_RATING_ROW_GAP_CLASS = 'gap-[18px]';
export const PDP_RATING_REVIEW_COUNT_CLASS =
  "font-['Montserrat_arm','Montserrat',sans-serif] text-lg font-medium leading-normal text-[#3c2f2f]";
/** Figma node 10:1888 — product price (pair with {@link montserratArmFont}). */
export const PDP_PRICE_CLASS =
  'whitespace-nowrap text-[2.25rem] font-[700] not-italic leading-normal text-[#3C2F2F]';
/** Strikethrough compare / original price beside current price on PDP. */
export const PDP_COMPARE_PRICE_CLASS =
  'whitespace-nowrap text-lg font-normal not-italic leading-normal text-[#3c2f2f] line-through';
export const PDP_PRICE_ROW_CLASS = 'mb-4 flex flex-wrap items-baseline gap-x-3';
/** Figma node 10:1944 — add-to-cart pill (240.19×48); slightly wider for «Ավելացնել զամբյուղ». */
export const PDP_ADD_TO_CART_BUTTON_CLASS =
  'flex h-12 min-w-0 max-lg:flex-1 items-center justify-center bg-[#ff7f20] text-base font-medium not-italic leading-normal whitespace-nowrap text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 lg:w-[16.25rem] lg:shrink-0';
/** Figma node 10:1917 — quantity selector pill (161×48). */
export const PDP_QUANTITY_SELECTOR_CLASS =
  `inline-flex h-12 max-lg:w-[7.25rem] max-lg:px-2.5 lg:w-[10.0625rem] lg:px-3.5 shrink-0 items-center justify-between border-2 border-[#ff7f20] bg-white ${PDP_PILL_RADIUS_CLASS}`;
/** Mobile — qty + add-to-cart + wishlist on one row. Desktop — single row (same order). */
export const PDP_ACTIONS_ROW_CLASS =
  'flex w-full min-w-0 flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-2.5';
export const PDP_ACTIONS_MOBILE_TOP_ROW_CLASS =
  'flex w-full min-w-0 items-center gap-2.5 lg:contents';
/** Figma nodes 10:2279 / 10:1942 — gray secondary icon pills (48×48). */
export const PDP_SECONDARY_ICON_BUTTON_CLASS =
  `flex size-12 shrink-0 items-center justify-center overflow-hidden bg-[#e4e4e4] ${PDP_PILL_RADIUS_CLASS}`;
/** PDP main image — circular discount badge (top-right). */
export const PDP_IMAGE_DISCOUNT_BADGE_CLASS =
  'absolute right-4 top-4 z-10 flex size-14 items-center justify-center rounded-full bg-[#ff7f20] text-base font-bold leading-none text-black';
/** Figma node 10:2231 — reviews summary panel (Frame 94). */
export const PDP_REVIEWS_PANEL_CLASS =
  'w-full rounded-[0.908rem] bg-white px-4 py-8 sm:px-8 lg:px-[5rem] lg:py-9';
export const PDP_REVIEWS_TITLE_CLASS =
  'text-[1.815rem] font-bold not-italic leading-normal text-black';
/** Title → distribution block (16.34px). */
export const PDP_REVIEWS_SUMMARY_GAP_CLASS = 'gap-4';
/** Bars column top offset vs score column (20.9px). */
export const PDP_REVIEWS_BARS_OFFSET_CLASS = 'md:pt-[21px]';
export const PDP_REVIEWS_BAR_ROWS_GAP_CLASS = 'gap-[7px]';
export const PDP_REVIEWS_BAR_LABEL_GAP_CLASS = 'gap-[21px]';
export const PDP_REVIEWS_BAR_HEIGHT_CLASS = 'h-[14px]';
export const PDP_REVIEWS_BAR_RADIUS_CLASS = 'rounded-[12px]';
export const PDP_REVIEWS_BAR_LABEL_CLASS =
  'w-4 shrink-0 text-center text-[22px] font-bold leading-none text-[#aaa]';
export const PDP_REVIEWS_SCORE_CLASS =
  'text-[64px] font-semibold leading-none text-[#030303] sm:text-[90px]';
export const PDP_REVIEWS_COUNT_CLASS =
  'mt-3 text-center text-[18px] font-normal leading-normal text-[#868686]';
/** Figma node 10:2273 — «Գրել կարծիք» CTA pill (295×48). */
export const PDP_REVIEWS_WRITE_BUTTON_CLASS =
  `flex h-12 w-[18.4375rem] max-w-full items-center justify-center bg-[#ff7f20] text-base font-medium not-italic leading-normal text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${PDP_PILL_RADIUS_CLASS}`;
export const PDP_REVIEWS_WRITE_BUTTON_WRAP_CLASS = 'mb-8 flex justify-center';

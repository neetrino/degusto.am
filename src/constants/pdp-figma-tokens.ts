/** Matches {@link UniversalHeader} content width — keeps PDP image left edge aligned with header. */
export const STOREFRONT_DESKTOP_CONTENT_CLASS = 'mx-auto w-full max-w-[1450px]';

/** Figma PDP (node 6:542) design tokens — DEGUSTO DEV 1. */
export const PDP_FIGMA_TEXT = '#3c2f2f';
export const PDP_FIGMA_ORANGE = '#ff7f20';
export const PDP_FIGMA_PILL_BG = '#e4e4e4';
export const PDP_FIGMA_DARK_SECTION = '#121212';
export const PDP_FIGMA_MUTED = '#868686';
export const PDP_FIGMA_PROGRESS_TRACK = '#dbdee1';

export const PDP_MAIN_RADIUS_CLASS = 'rounded-[40px]';
/** Figma node 10:1873 — hero product frame (717×1379 in design). */
export const PDP_HERO_FRAME_CLASS = `${PDP_MAIN_RADIUS_CLASS} w-full overflow-hidden bg-white lg:min-h-[44.8125rem]`;
export const PDP_HERO_FRAME_MAX_WIDTH_CLASS = 'max-w-[86.1875rem]';
export const PDP_HERO_IMAGE_OFFSET_CLASS = 'lg:pt-[1.8125rem]';
export const PDP_HERO_INFO_OFFSET_CLASS = 'lg:pt-[2.75rem]';
export const PDP_HERO_COLUMN_GAP_CLASS = 'lg:gap-[47px]';
/** Figma node 10:1872 — main PDP image frame width. */
export const PDP_MAIN_IMAGE_WIDTH = '47.5625rem';
export const PDP_MAIN_IMAGE_MAX_WIDTH_CLASS = 'max-w-[47.5625rem]';
export const PDP_MAIN_IMAGE_GRID_COLUMN_CLASS = 'lg:grid-cols-[47.5625rem_minmax(0,1fr)]';
export const PDP_HERO_GRID_CLASS = `grid grid-cols-1 items-start gap-6 max-lg:gap-5 ${PDP_MAIN_IMAGE_GRID_COLUMN_CLASS} ${PDP_HERO_COLUMN_GAP_CLASS}`;
export const PDP_MAIN_IMAGE_ASPECT_CLASS = 'aspect-[42/25]';
export const PDP_IMAGE_RADIUS_CLASS = 'rounded-[2.125rem]';
export const PDP_PILL_RADIUS_CLASS = 'rounded-[70px]';
/** Figma node 10:1953 — «Ավելացնել» customization pill. */
export const PDP_CUSTOMIZATION_ADD_PILL_CLASS = 'h-[3rem] w-[12.1875rem]';
/** Figma node 10:1958 — «Բացառել» customization pill. */
export const PDP_CUSTOMIZATION_EXCLUDE_PILL_CLASS = 'h-[3rem] w-[10.9375rem]';
export const PDP_CUSTOMIZATION_PILL_HEIGHT_CLASS = 'h-[3rem]';
/** Figma node 10:1889 — product description body. */
export const PDP_DESCRIPTION_CLASS =
  "mb-5 max-w-[31.125rem] font-['Montserrat_arm','Montserrat',sans-serif] text-base font-normal leading-6 text-[#3c2f2f] [&_a]:text-[#ff7f20] [&_a]:underline [&_li]:leading-6 [&_p]:leading-6 [&_p]:text-[#3c2f2f]";
/** Figma node 10:1884 — PDP rating star row. */
export const PDP_RATING_STAR_SIZE_CLASS = 'size-[35px]';
export const PDP_RATING_STAR_GAP_CLASS = 'gap-[7px]';
export const PDP_RATING_ROW_GAP_CLASS = 'gap-[18px]';
export const PDP_RATING_REVIEW_COUNT_CLASS =
  "font-['Montserrat_arm','Montserrat',sans-serif] text-lg font-medium leading-normal text-[#3c2f2f]";
/** Figma node 10:1888 — product price. */
export const PDP_PRICE_CLASS =
  "mb-4 font-['Montserrat_arm','Montserrat',sans-serif] text-[2.25rem] font-bold leading-normal text-[#3c2f2f]";

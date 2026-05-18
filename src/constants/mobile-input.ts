/** Tailwind `lg` breakpoint — mobile-only input sheet behavior applies below this width. */
export const MOBILE_VIEWPORT_MEDIA_QUERY = '(max-width: 1023px)';

export const MOBILE_INPUT_SHEET_Z_INDEX = 200;

/** Extra offset below safe-area so the bar sits under the status bar, not flush to the top. */
export const MOBILE_INPUT_SHEET_TOP_OFFSET_PX = 44;

/** 16px — avoids iOS Safari zoom when the sheet input is focused. */
export const MOBILE_INPUT_SHEET_TEXT_CLASS = 'text-base leading-6';

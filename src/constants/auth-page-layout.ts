/** Brand orange used on login/register surfaces. */
export const AUTH_PAGE_BRAND_ORANGE = '#F66812';

export const AUTH_PAGE_BRAND_ORANGE_CLASS = 'lg:bg-[#F66812]';

/** Desktop universal header spacer offset (login/register only). */
export const AUTH_PAGE_DESKTOP_HEADER_OFFSET_CLASS = 'lg:-mt-[104px] lg:pt-[104px]';

/** Mobile: flat on storefront white sheet; desktop: cream gradient card on orange hero. */
export const AUTH_PAGE_CARD_CLASS =
  'relative border-0 bg-transparent p-0 shadow-none lg:rounded-t-[70px] lg:border lg:border-transparent lg:bg-[linear-gradient(160deg,#ffffff_0%,#fff4ea_34%,#ffe6d2_62%,#ffd6b5_100%)] lg:px-8 lg:pb-8 lg:pt-24 lg:shadow-[0_20px_45px_rgba(246,104,18,0.28)] lg:backdrop-blur-sm';

export const AUTH_PAGE_GLOW_PRIMARY_CLASS =
  'pointer-events-none absolute inset-y-3 -left-10 -right-10 hidden rounded-[120px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.72)_42%,rgba(246,104,18,0.4)_72%,rgba(246,104,18,0)_100%)] blur-3xl lg:block';

export const AUTH_PAGE_GLOW_SECONDARY_CLASS =
  'pointer-events-none absolute inset-y-8 -left-14 -right-14 hidden rounded-[140px] bg-[radial-gradient(ellipse_at_center,rgba(246,104,18,0.28)_0%,rgba(246,104,18,0.16)_45%,rgba(255,255,255,0)_80%)] blur-3xl lg:block';

/** Matches mobile storefront search/input pill (Figma parity). */
export const AUTH_FORM_INPUT_SHADOW_CLASS = 'shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]';

export const AUTH_FORM_WRAPPER_CLASS = 'mx-auto w-full max-w-md lg:max-w-none';

export const AUTH_FORM_TITLE_CLASS =
  'text-center text-[28px] font-bold leading-[1.15] tracking-tight text-[#1F2E1F] lg:text-left lg:text-3xl';

export const AUTH_FORM_SUBTITLE_CLASS =
  'mt-3 text-center text-sm leading-relaxed text-[#1F2E1F]/70 lg:mt-2 lg:text-left lg:text-base lg:text-[#1F2E1F]';

export const AUTH_FORM_HEADER_CLASS = 'mb-8 lg:mb-8';

export const AUTH_FORM_CLASS = 'space-y-5 lg:space-y-4';

export const AUTH_FORM_FIELD_CLASS = 'space-y-2';

export const AUTH_FORM_LABEL_CLASS =
  'block text-sm font-semibold text-[#1F2E1F] lg:font-medium';

export const AUTH_FORM_REQUIRED_MARK_CLASS = 'ml-0.5 text-[#F66812]';

export const AUTH_FORM_INPUT_CLASS = [
  'h-12 w-full rounded-[30px] border border-[#ECECEC] bg-white px-4 text-base text-[#1F2E1F]',
  AUTH_FORM_INPUT_SHADOW_CLASS,
  'placeholder:text-[#A1A1AA] transition-[border-color,box-shadow] duration-200',
  'hover:border-[#F66812]/45 focus:border-[#F66812] focus:outline-none focus:ring-2 focus:ring-[#F66812]/15',
  'disabled:cursor-not-allowed disabled:opacity-60',
  'lg:h-10 lg:rounded-lg lg:shadow-none lg:border-gray-300 lg:text-sm lg:placeholder:text-[#1F2E1F]/70',
].join(' ');

export const AUTH_FORM_INPUT_PASSWORD_CLASS = `${AUTH_FORM_INPUT_CLASS} pr-12`;

export const AUTH_FORM_PASSWORD_TOGGLE_CLASS =
  'absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#1F2E1F]/55 transition-colors hover:bg-[#F66812]/8 hover:text-[#1F2E1F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F66812]/25';

export const AUTH_FORM_ERROR_CLASS =
  'mb-6 rounded-[20px] border border-red-100 bg-red-50/90 px-4 py-3 lg:mb-4 lg:rounded-lg';

export const AUTH_FORM_OPTIONS_ROW_CLASS =
  'flex min-h-11 items-center justify-between gap-3 pt-1 lg:pt-0';

export const AUTH_FORM_CHECKBOX_CLASS =
  'h-[18px] w-[18px] shrink-0 rounded border-[#D4D4D4] text-[#F66812] focus:ring-[#F66812]/25';

export const AUTH_FORM_CHECKBOX_LABEL_CLASS = 'ml-2.5 text-sm leading-none text-[#1F2E1F]';

export const AUTH_FORM_LINK_CLASS =
  'shrink-0 text-sm font-semibold text-[#F66812] transition-opacity hover:underline active:opacity-80';

export const AUTH_FORM_SUBMIT_CLASS = [
  'mt-1 h-12 w-full rounded-[30px] border border-[#1F3A22] bg-[#1F3A22] text-base font-semibold text-white',
  'shadow-[0px_6px_16px_rgba(31,58,34,0.22)] transition-[background-color,transform] duration-200',
  'hover:bg-[#18301C] active:scale-[0.99] disabled:scale-100 disabled:opacity-60',
  'lg:mt-0 lg:h-10 lg:rounded-lg lg:text-sm lg:shadow-none',
].join(' ');

export const AUTH_FORM_FOOTER_CLASS =
  'mt-8 border-t border-[#F0F0F0] pt-6 text-center lg:mt-6 lg:border-0 lg:pt-0';

export const AUTH_FORM_FOOTER_TEXT_CLASS = 'text-sm text-[#1F2E1F]/80';

export const AUTH_FORM_FOOTER_LINK_CLASS = 'font-semibold text-[#F66812] hover:underline';

export const AUTH_FORM_NAME_GRID_CLASS = 'grid grid-cols-2 gap-3 lg:gap-4';

export const AUTH_FORM_HINT_CLASS = 'mt-1.5 text-xs leading-relaxed text-[#1F2E1F]/60';

export const AUTH_FORM_TERMS_ROW_CLASS = 'flex items-start gap-2.5 rounded-[20px] bg-[#FAFAFA] px-3 py-3 lg:rounded-lg lg:bg-transparent lg:px-0 lg:py-0';

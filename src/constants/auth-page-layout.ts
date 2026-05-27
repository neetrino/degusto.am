/** Brand orange used on login/register surfaces. */
export const AUTH_PAGE_BRAND_ORANGE = '#F66812';

export const AUTH_PAGE_BRAND_ORANGE_CLASS = 'bg-[#F66812]';

/** Desktop universal header spacer offset (login/register only). */
export const AUTH_PAGE_DESKTOP_HEADER_OFFSET_CLASS = 'lg:-mt-[104px] lg:pt-[104px]';

/** Shared auth card treatment for desktop and mobile. */
export const AUTH_PAGE_CARD_CLASS =
  'relative overflow-visible rounded-[30px] border border-[#FFE5CF] bg-[linear-gradient(168deg,#fffef9_0%,#fff7eb_44%,#ffeed9_100%)] p-6 shadow-[0_24px_60px_rgba(50,24,0,0.22)] sm:p-8 lg:rounded-[34px] lg:px-10 lg:pb-10 lg:pt-11';

export const AUTH_PAGE_GLOW_PRIMARY_CLASS =
  'pointer-events-none absolute -inset-x-8 -top-16 h-56 rounded-[100px] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.56)_0%,rgba(255,255,255,0.16)_52%,rgba(255,255,255,0)_100%)] blur-2xl';

export const AUTH_PAGE_GLOW_SECONDARY_CLASS =
  'pointer-events-none absolute -bottom-16 left-1/2 h-28 w-[80%] -translate-x-1/2 rounded-[120px] bg-[radial-gradient(ellipse_at_center,rgba(31,58,34,0.34)_0%,rgba(31,58,34,0)_75%)] blur-2xl';

/** Matches mobile storefront search/input pill (Figma parity). */
export const AUTH_FORM_INPUT_SHADOW_CLASS = 'shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]';

export const AUTH_FORM_WRAPPER_CLASS = 'mx-auto w-full max-w-xl';

export const AUTH_FORM_TITLE_CLASS =
  'text-center text-[30px] font-bold leading-[1.15] tracking-tight text-[#16331f] sm:text-[32px]';

export const AUTH_FORM_SUBTITLE_CLASS =
  'mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-[#395145] sm:text-[15px]';

export const AUTH_FORM_HEADER_CLASS = 'mb-7 text-center sm:mb-8';

export const AUTH_FORM_CLASS = 'space-y-4 sm:space-y-[18px]';

export const AUTH_FORM_FIELD_CLASS = 'space-y-2.5';

export const AUTH_FORM_LABEL_CLASS =
  'block text-sm font-semibold text-[#1d3b27]';

export const AUTH_FORM_REQUIRED_MARK_CLASS = 'ml-0.5 text-[#F66812]';

export const AUTH_FORM_INPUT_CLASS = [
  'h-12 w-full rounded-2xl border border-[#ead7bf] bg-[#fffaf2] px-4 text-[15px] text-[#183322]',
  AUTH_FORM_INPUT_SHADOW_CLASS,
  'placeholder:text-[#7f8f84] transition-[border-color,box-shadow,background-color] duration-200',
  'hover:border-[#f66812]/45 focus:border-[#f66812] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#f66812]/15',
  'disabled:cursor-not-allowed disabled:opacity-60',
].join(' ');

export const AUTH_FORM_INPUT_PASSWORD_CLASS = `${AUTH_FORM_INPUT_CLASS} pr-12`;

export const AUTH_FORM_PASSWORD_TOGGLE_CLASS =
  'absolute right-3.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#375445] transition-colors hover:bg-[#f66812]/10 hover:text-[#1f3a22] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f66812]/30';

export const AUTH_FORM_ERROR_CLASS =
  'mb-5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3';

export const AUTH_FORM_OPTIONS_ROW_CLASS =
  'flex min-h-11 items-center justify-between gap-3 pt-1';

export const AUTH_FORM_CHECKBOX_CLASS =
  'h-[18px] w-[18px] shrink-0 rounded border-[#cfbc9f] text-[#f66812] focus:ring-[#f66812]/25';

export const AUTH_FORM_CHECKBOX_LABEL_CLASS = 'ml-2.5 text-sm leading-none text-[#274531]';

export const AUTH_FORM_LINK_CLASS =
  'shrink-0 text-sm font-semibold text-[#f66812] transition-opacity hover:underline active:opacity-80';

export const AUTH_FORM_SUBMIT_CLASS = [
  'mt-1 h-12 w-full rounded-2xl border border-[#1f3a22] bg-[#1f3a22] text-base font-semibold text-[#fffdf8]',
  'shadow-[0px_10px_20px_rgba(31,58,34,0.24)] transition-[background-color,transform,box-shadow] duration-200',
  'hover:bg-[#19311c] hover:shadow-[0px_14px_24px_rgba(31,58,34,0.28)] active:scale-[0.99] disabled:scale-100 disabled:opacity-60',
].join(' ');

export const AUTH_FORM_FOOTER_CLASS =
  'mt-7 border-t border-[#efdccb] pt-5 text-center';

export const AUTH_FORM_FOOTER_TEXT_CLASS = 'text-sm text-[#2d4738]/85';

export const AUTH_FORM_FOOTER_LINK_CLASS = 'font-semibold text-[#f66812] hover:underline';

export const AUTH_FORM_NAME_GRID_CLASS = 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4';

export const AUTH_FORM_HINT_CLASS = 'mt-1.5 text-xs leading-relaxed text-[#355142]/70';

export const AUTH_FORM_TERMS_ROW_CLASS =
  'flex items-start gap-2.5 rounded-2xl bg-[#fff6ea] px-3 py-3';

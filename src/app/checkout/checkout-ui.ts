/**
 * Shared Tailwind class fragments for checkout (matches cart / profile brand).
 */
import { STOREFRONT_DESKTOP_SECTION_CLASS } from '@/constants/storefront-desktop-layout';

/** Page shell — mobile padding from storefront chrome; tablet+ aligned with header (1450px). */
export const CHECKOUT_PAGE_SHELL_CLASS = `${STOREFRONT_DESKTOP_SECTION_CLASS} py-8 max-md:px-0 md:py-10`;

/** Two columns from tablet (iPad portrait); wider form + sticky summary on desktop. */
export const CHECKOUT_PAGE_GRID_CLASS =
  'grid grid-cols-1 items-start gap-6 md:grid-cols-5 md:gap-8 lg:grid-cols-3';

export const CHECKOUT_FORM_COLUMN_CLASS = 'min-w-0 md:col-span-3 lg:col-span-2';

export const CHECKOUT_SUMMARY_COLUMN_CLASS = 'min-w-0 md:col-span-2 lg:col-span-1';

/** Sticky order summary — below UniversalHeader spacer (92px / 104px). */
export const CHECKOUT_SUMMARY_PANEL_CLASS =
  'w-full self-start md:sticky md:top-[92px] lg:top-[104px]';

export const CHECKOUT_SECTION_TITLE_TEXT = 'text-2xl font-bold text-[#1F2E1F]';

export const CHECKOUT_SECTION_TITLE = `${CHECKOUT_SECTION_TITLE_TEXT} mb-6`;

export const CHECKOUT_CARD_FRAME = 'border border-[#F66812]/20 shadow-sm';

export const CHECKOUT_OPTION_SELECTED =
  'border-[#F66812] bg-[#F66812]/[0.08] shadow-sm';

export const CHECKOUT_OPTION_IDLE =
  'border-[#F66812]/20 hover:bg-[#F66812]/[0.04]';

export const CHECKOUT_MODAL_PANEL =
  'max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#F66812]/20 bg-white p-6 shadow-2xl';

export const CHECKOUT_PRIMARY_BUTTON =
  '!bg-[#F66812] hover:!bg-[#e45f10] focus:!ring-[#F66812]';

export const CHECKOUT_OUTLINE_BUTTON =
  'border-[#F66812]/40 text-[#F66812] hover:border-[#F66812] hover:bg-[#F66812]/10';

/** Primary copy on checkout (Degusto ink; matches cart headers). */
export const CHECKOUT_TEXT_INK = 'text-[#1F2E1F]';

/** Secondary / description copy. */
export const CHECKOUT_TEXT_INK_MUTED = 'text-[#1F2E1F]/70';

/** Summary row labels (slightly softer than body). */
export const CHECKOUT_TEXT_LABEL = 'text-[#1F2E1F]/75';

/** Emphasized amounts and values (non-orange). */
export const CHECKOUT_TEXT_VALUE = 'font-semibold text-[#1F2E1F]';

export const CHECKOUT_MODAL_CLOSE_ICON =
  'text-[#1F2E1F]/40 transition-colors hover:text-[#F66812]';

/** Main page title (checkout). */
export const CHECKOUT_PAGE_TITLE = 'text-3xl font-bold text-[#1F2E1F]';

/** Tertiary / fine print. */
export const CHECKOUT_TEXT_INK_TERTIARY = 'text-sm text-[#1F2E1F]/55';

/** Borbor-style payment row shell — tighter on tablet to avoid overflow. */
export const CHECKOUT_PAYMENT_OPTION =
  'flex min-h-[3.75rem] cursor-pointer items-center gap-3 rounded-full border bg-white px-4 py-3.5 transition-all md:gap-4 md:px-5';

export const CHECKOUT_PAYMENT_OPTION_SELECTED =
  'border-[#F66812] bg-[#FFF7F0] shadow-sm ring-1 ring-[#F66812]/15';

export const CHECKOUT_PAYMENT_OPTION_IDLE =
  'border-[#E6EBF0] hover:border-[#F66812]/30 hover:bg-[#FFFBF8]';

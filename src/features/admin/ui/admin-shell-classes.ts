/** Shared Tailwind classes: Degusto admin shell (dark culinary sidebar). */

export const ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP =
  "mb-6 shrink-0 px-4 pt-8 sm:px-6 lg:hidden lg:pt-0";

/** Width is set in `AdminSidebar` (expanded vs collapsed). */
export const ADMIN_SIDEBAR_ASIDE =
  "admin-sidebar-home-bg admin-sidebar-scrollbar hidden lg:flex lg:h-full lg:shrink-0 lg:flex-col overflow-hidden rounded-r-[15px] border-r border-white/10 text-white transition-[width] duration-200 ease-out";

export const ADMIN_SIDEBAR_NAV =
  "flex min-h-0 flex-1 flex-col space-y-1 overflow-y-auto overscroll-y-contain px-2 py-6";

/** Desktop: viewport-height shell so only the main column scrolls; sidebar stays fixed. */
export const ADMIN_PAGE_SHELL =
  "flex min-h-screen flex-col bg-[#f4f1ec] lg:h-dvh lg:max-h-dvh lg:flex-row lg:overflow-hidden";

export const ADMIN_MAIN_COLUMN =
  "min-w-0 flex-1 px-4 pb-8 pt-12 sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:px-8";

export const ADMIN_MAIN_INNER = "w-full";

/** Active nav row on the dark green sidebar. */
export const ADMIN_NAV_ACTIVE =
  "bg-[#ff7f20] text-white shadow-[0_8px_24px_rgba(255,127,32,0.28)]";

/** Inactive nav row on the dark green sidebar. */
export const ADMIN_NAV_IDLE =
  "text-white/80 hover:bg-white/10 hover:text-white";

export const ADMIN_NAV_ICON_ACTIVE = "text-white";
export const ADMIN_NAV_ICON_IDLE = "text-white/65";

export const ADMIN_MOBILE_MENU_TRIGGER =
  "inline-flex items-center gap-2 rounded-full border border-[#ff7f20]/35 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#3e573d] shadow-sm transition-colors hover:border-[#ff7f20] hover:text-[#ff7f20]";

export const ADMIN_DRAWER_PANEL =
  "w-[min(18rem,85vw)] min-w-[16rem] max-w-full";

/** Mobile menu sheet nav (cream surface — not dark sidebar). */
export const ADMIN_SHEET_NAV_ACTIVE =
  "bg-[#ff7f20] text-white shadow-[0_8px_20px_rgba(255,127,32,0.22)]";

export const ADMIN_SHEET_NAV_IDLE =
  "text-[#3c2f2f] hover:bg-[#fff4eb] hover:text-[#1f1a17]";

/** Shared Tailwind classes: Degusto admin shell (dark culinary sidebar). */

export const ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP =
  "sticky top-0 z-30 shrink-0 border-b border-[#ead7bf]/80 bg-[#f4f1ec]/92 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md sm:px-4 lg:hidden";

/** Width is set in `AdminSidebar` (expanded vs collapsed). */
export const ADMIN_SIDEBAR_ASIDE =
  "admin-sidebar-home-bg admin-sidebar-scrollbar hidden lg:flex lg:h-full lg:shrink-0 lg:flex-col overflow-hidden rounded-r-[15px] border-r border-white/10 text-white transition-[width] duration-200 ease-out";

export const ADMIN_SIDEBAR_NAV =
  "flex min-h-0 flex-1 flex-col space-y-1 overflow-y-auto overscroll-y-contain px-2 py-6";

/** Desktop: viewport-height shell so only the main column scrolls; sidebar stays fixed. */
export const ADMIN_PAGE_SHELL =
  "flex min-h-screen flex-col bg-[#f4f1ec] lg:h-dvh lg:max-h-dvh lg:flex-row lg:overflow-hidden";

export const ADMIN_MAIN_COLUMN =
  "min-w-0 flex-1 px-3 pb-8 pt-4 sm:px-6 sm:pt-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:px-8 lg:pt-12";

export const ADMIN_MAIN_INNER = "w-full min-w-0 max-w-full";

/** Active nav row on the dark green sidebar. */
export const ADMIN_NAV_ACTIVE =
  "bg-[#ff7f20] text-white shadow-[0_8px_24px_rgba(255,127,32,0.28)]";

/** Inactive nav row on the dark green sidebar. */
export const ADMIN_NAV_IDLE =
  "text-white/80 hover:bg-white/10 hover:text-white";

export const ADMIN_NAV_ICON_ACTIVE = "text-white";
export const ADMIN_NAV_ICON_IDLE = "text-white/65";

export const ADMIN_MOBILE_MENU_TRIGGER =
  "inline-flex h-10 items-center gap-2 rounded-2xl border border-[#ead7bf] bg-white px-3.5 text-xs font-bold uppercase tracking-[0.08em] text-[#1f3a22] shadow-[0_8px_20px_-14px_rgba(28,25,23,0.45)] transition-all hover:border-[#ff7f20]/55 hover:text-[#ff7f20] active:scale-[0.98]";

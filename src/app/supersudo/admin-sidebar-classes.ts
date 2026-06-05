/** Shared Tailwind classes: desktop admin sidebar flush to the viewport left edge. */
export const ADMIN_SIDEBAR_MOBILE_DRAWER_WRAP =
  'lg:hidden mb-6 shrink-0 px-4 pt-8 sm:px-6 lg:pt-0';

/** Width is set in `AdminSidebar` (expanded vs collapsed). */
export const ADMIN_SIDEBAR_ASIDE =
  'admin-sidebar-home-bg hidden lg:flex lg:h-[calc(100dvh-2rem)] lg:shrink-0 lg:flex-col border border-white/10 bg-[#062c20] text-white shadow-[0_24px_64px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_0_56px_rgba(7,50,32,0.7)] transition-[width] duration-300 ease-out lg:m-4 lg:rounded-[28px]';

export const ADMIN_SIDEBAR_SCROLLBAR = 'admin-sidebar-scrollbar';

export const ADMIN_SIDEBAR_NAV =
  'admin-sidebar-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-2 pb-3 pt-4';

/** Desktop: viewport-height shell so only the main column scrolls; sidebar stays fixed. */
export const ADMIN_PAGE_SHELL =
  'flex min-h-screen flex-col bg-gray-50 lg:h-dvh lg:max-h-dvh lg:flex-row lg:overflow-hidden';

export const ADMIN_MAIN_COLUMN =
  'min-w-0 flex-1 pt-12 pb-8 px-4 sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-y-contain lg:px-8';

export const ADMIN_MAIN_INNER = 'max-w-7xl mx-auto w-full';

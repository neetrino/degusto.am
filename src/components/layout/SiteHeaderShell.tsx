"use client";

import { usePathname } from "next/navigation";

import type { Locale } from "@/lib/i18n/config";

type SiteHeaderShellProps = {
  locale: Locale;
  children: React.ReactNode;
};

function isHomePath(pathname: string, locale: Locale): boolean {
  return pathname === `/${locale}` || pathname === `/${locale}/`;
}

/**
 * Fixed storefront pill header — stays visible while the page scrolls.
 * Hidden on the home route below `lg` so HomeMobile owns orange mobile chrome.
 */
export function SiteHeaderShell({ locale, children }: SiteHeaderShellProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const hideOnMobileHome = isHomePath(pathname, locale);

  return (
    <div
      className={
        hideOnMobileHome
          ? "site-header pointer-events-none fixed inset-x-0 top-0 z-[80] hidden lg:block"
          : "site-header pointer-events-none fixed inset-x-0 top-0 z-[80]"
      }
      data-site-header
    >
      {children}
    </div>
  );
}

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

function isShopCatalogPath(pathname: string, locale: Locale): boolean {
  const base = `/${locale}/products`;
  return pathname === base || pathname === `${base}/`;
}

/**
 * Fixed storefront pill header — stays visible while the page scrolls.
 * Hidden below `lg` on home and shop catalog so mobile chrome owns the header.
 */
export function SiteHeaderShell({ locale, children }: SiteHeaderShellProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const hideOnMobileChrome =
    isHomePath(pathname, locale) || isShopCatalogPath(pathname, locale);

  return (
    <div
      className={
        hideOnMobileChrome
          ? "site-header pointer-events-none fixed inset-x-0 top-0 z-[80] hidden lg:block"
          : "site-header pointer-events-none fixed inset-x-0 top-0 z-[80]"
      }
      data-site-header
    >
      {children}
    </div>
  );
}

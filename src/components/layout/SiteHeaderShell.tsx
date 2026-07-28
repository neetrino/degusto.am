"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { Locale } from "@/lib/i18n/config";

type SiteHeaderShellProps = {
  locale: Locale;
  children: ReactNode;
};

function isHomePath(pathname: string, locale: Locale): boolean {
  return pathname === `/${locale}` || pathname === `/${locale}/`;
}

function isShopCatalogPath(pathname: string, locale: Locale): boolean {
  const base = `/${locale}/products`;
  return pathname === base || pathname === `${base}/`;
}

function isWishlistPath(pathname: string, locale: Locale): boolean {
  const base = `/${locale}/wishlist`;
  return pathname === base || pathname === `${base}/`;
}

function isProductDetailPath(pathname: string, locale: Locale): boolean {
  const base = `/${locale}/products/`;
  if (!pathname.startsWith(base)) {
    return false;
  }
  const rest = pathname.slice(base.length);
  return rest.length > 0 && !rest.includes("/");
}

function isAuthPath(pathname: string, locale: Locale): boolean {
  const prefixes = [
    `/${locale}/login`,
    `/${locale}/register`,
    `/${locale}/forgot-password`,
    `/${locale}/reset-password`,
  ];
  return prefixes.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

/**
 * Fixed storefront pill header — stays visible while the page scrolls.
 * Hidden below `lg` on home, shop, wishlist, PDP, and auth so mobile chrome owns the header.
 */
export function SiteHeaderShell({ locale, children }: SiteHeaderShellProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const hideOnMobileChrome =
    isHomePath(pathname, locale) ||
    isShopCatalogPath(pathname, locale) ||
    isWishlistPath(pathname, locale) ||
    isProductDetailPath(pathname, locale) ||
    isAuthPath(pathname, locale);

  return (
    <div
      className={
        hideOnMobileChrome
          ? "site-header pointer-events-none fixed inset-x-0 top-0 z-[1100] hidden lg:block"
          : "site-header pointer-events-none fixed inset-x-0 top-0 z-[1100]"
      }
      data-site-header
    >
      {children}
    </div>
  );
}

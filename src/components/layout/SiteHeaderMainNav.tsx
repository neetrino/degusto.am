"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { AccountControls } from "@/components/layout/AccountControls";
import { HeaderCartButton } from "@/components/layout/HeaderCartButton";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { LocaleCurrencySwitcher } from "@/components/layout/LocaleCurrencySwitcher";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { AppLink } from "@/components/ui/AppLink";
import { WishlistHeaderLink } from "@/features/wishlist/ui/WishlistHeaderLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";

type NavItem = {
  href: string;
  label: string;
};

type SiteHeaderMainNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  user: SessionUser | null;
  navItems: readonly NavItem[];
  cartItemCount: number;
  cartTotalFormatted: string;
  wishlistCount: number;
};

const LOGO_SRC = "/assets/brand/degusto-logo.webp";

function isNavActive(pathname: string, href: string, locale: Locale): boolean {
  const pathOnly = href.split("?")[0] ?? href;
  if (pathOnly === `/${locale}` || pathOnly === `/${locale}/`) {
    return pathname === `/${locale}` || pathname === `/${locale}/`;
  }
  // Exact segment match — /products must not activate /combo and vice versa.
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

export function SiteHeaderMainNav({
  locale,
  currency,
  dictionary,
  user,
  navItems,
  cartItemCount,
  cartTotalFormatted,
  wishlistCount,
}: SiteHeaderMainNavProps) {
  const pathname = usePathname() ?? `/${locale}`;

  return (
    <header className="pointer-events-auto relative z-40 px-3 pt-3 sm:px-6 md:px-8">
      <div className="mx-auto flex h-20 max-w-[min(1450px,calc(100%-2rem))] items-center gap-2 overflow-visible rounded-[120px] border border-white/10 bg-gradient-to-r from-[#0f1017] to-[#13151d] px-6 shadow-2xl md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-8 lg:max-w-[min(1450px,calc(100%-3rem))] lg:px-10 xl:px-11">
        <AppLink
          href={`/${locale}`}
          prefetchPolicy="intent"
          className="relative h-10 w-[110px] shrink-0 overflow-hidden sm:h-12 sm:w-[134px]"
          aria-label={dictionary.brand}
        >
          <Image
            src={LOGO_SRC}
            alt={dictionary.brand}
            fill
            sizes="134px"
            className="object-contain object-left"
            priority
          />
        </AppLink>

        <nav
          aria-label={dictionary.nav.navigation}
          className="ml-2 hidden items-center gap-6 xl:ml-6 xl:flex xl:gap-[30px]"
        >
          {navItems.map((item) => {
            const active = isNavActive(pathname, item.href, locale);
            return (
              <AppLink
                key={`${item.href}-${item.label}`}
                href={item.href}
                prefetchPolicy="intent"
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-base font-semibold whitespace-nowrap text-brand transition hover:text-brand"
                    : "text-base font-semibold whitespace-nowrap text-white/90 transition hover:text-white"
                }
              >
                {item.label}
              </AppLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <HeaderSearch
            locale={locale}
            searchLabel={dictionary.header.search}
            placeholder={dictionary.header.searchPlaceholder}
          />

          <div className="hidden items-center gap-2 md:flex md:gap-[7px]">
            <HeaderCartButton
              locale={locale}
              currency={currency}
              dictionary={dictionary}
              itemCount={cartItemCount}
              totalFormatted={cartTotalFormatted}
            />

            <WishlistHeaderLink
              locale={locale}
              label={dictionary.nav.wishlist}
              count={wishlistCount}
              className="inline-flex size-12 items-center justify-center rounded-full bg-white text-brand shadow-sm transition hover:bg-white/90"
              iconClassName="size-7 fill-brand"
            />

            <LocaleCurrencySwitcher
              locale={locale}
              currency={currency}
              currencyLabel={dictionary.header.currency}
              languageLabel={dictionary.header.language}
              variant="degusto"
            />

            <AccountControls
              locale={locale}
              loginLabel={dictionary.header.login}
              logoutLabel={dictionary.header.logout}
              profileLabel={dictionary.header.profile}
              adminLabel={dictionary.header.admin}
              user={user}
              triggerClassName="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-colors hover:ring-brand/40"
              icon={
                <Image
                  src="/assets/brand/account-arrow-up.webp"
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 translate-x-0.5 -translate-y-0.5 object-contain"
                  aria-hidden
                />
              }
            />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LocaleCurrencySwitcher
              locale={locale}
              currency={currency}
              currencyLabel={dictionary.header.currency}
              languageLabel={dictionary.header.language}
              variant="degusto"
            />
            <MobileNavDrawer
              locale={locale}
              dictionary={dictionary}
              navItems={navItems}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

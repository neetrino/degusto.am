import Image from "next/image";
import { UserRound } from "lucide-react";

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

const LOGO_SRC = "/assets/brand/logo.webp";

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
  return (
    <header className="pointer-events-auto relative z-40 px-3 pt-4 sm:px-6 md:px-8 md:pt-6">
      <div className="mx-auto flex h-16 max-w-[1374px] items-center gap-3 rounded-full bg-black px-3 sm:h-20 sm:gap-4 sm:px-5 md:px-8">
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
          {navItems.map((item) => (
            <AppLink
              key={`${item.href}-${item.label}`}
              href={item.href}
              prefetchPolicy="intent"
              className="text-base font-semibold whitespace-nowrap text-white/90 transition hover:text-white"
            >
              {item.label}
            </AppLink>
          ))}
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
              triggerClassName="inline-flex size-12 items-center justify-center rounded-full bg-white text-brand shadow-sm transition hover:bg-white/90"
              icon={<UserRound className="size-7" aria-hidden />}
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

"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { AccountControls } from "@/components/layout/AccountControls";
import { HeaderCartButton } from "@/components/layout/HeaderCartButton";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { LocaleCurrencySwitcher } from "@/components/layout/LocaleCurrencySwitcher";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import {
  HEADER_EASE,
  headerItemVariants,
  headerNavGroupVariants,
  headerNavLinkVariants,
  headerShellVariants,
  useHeaderScrollMotion,
} from "@/components/layout/SiteHeaderMotion";
import { AppLink } from "@/components/ui/AppLink";
import { WishlistHeaderLink } from "@/features/wishlist/ui/WishlistHeaderLink";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import type { SessionUser } from "@/lib/auth/session";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

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

const LOGO_SRC = staticAssetUrl("/assets/brand/degusto-logo.webp");

function isNavActive(pathname: string, href: string, locale: Locale): boolean {
  const pathOnly = href.split("?")[0] ?? href;
  if (pathOnly === `/${locale}` || pathOnly === `/${locale}/`) {
    return pathname === `/${locale}` || pathname === `/${locale}/`;
  }
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
  const {
    reduceMotion,
    scrolled,
    pillY,
    pillScale,
    pillPadY,
    glowOpacity,
  } = useHeaderScrollMotion();

  return (
    <motion.header
      style={{ paddingTop: pillPadY, y: pillY }}
      className="pointer-events-auto relative z-40 px-3 sm:px-6 md:px-8"
    >
      <motion.div
        style={{ scale: pillScale }}
        className="relative mx-auto origin-top will-change-transform"
      >
        <motion.div
          aria-hidden
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute -inset-x-6 -inset-y-4 rounded-[140px] bg-[radial-gradient(ellipse_at_center,rgba(246,104,18,0.35),transparent_68%)] blur-2xl"
        />

        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={reduceMotion ? undefined : headerShellVariants}
          className={[
            "relative mx-auto flex max-w-[min(1450px,calc(100%-2rem))] items-center gap-2 overflow-visible rounded-[120px] border px-6 shadow-2xl transition-[height,box-shadow,border-color,background] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-8 lg:max-w-[min(1450px,calc(100%-3rem))] lg:px-10 xl:px-11",
            scrolled
              ? "h-[68px] border-brand/25 bg-gradient-to-r from-[#0c0d12]/95 to-[#12141c]/95 shadow-[0_18px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(246,104,18,0.12)] backdrop-blur-xl"
              : "h-20 border-white/10 bg-gradient-to-r from-[#0f1017] to-[#13151d] shadow-[0_22px_60px_rgba(0,0,0,0.4)]",
          ].join(" ")}
        >
          <motion.div
            variants={reduceMotion ? undefined : headerItemVariants}
            whileHover={reduceMotion ? undefined : { scale: 1.04, rotate: -1.5 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="shrink-0"
          >
            <AppLink
              href={`/${locale}`}
              prefetchPolicy="intent"
              className="relative block h-10 w-[110px] overflow-hidden sm:h-12 sm:w-[134px]"
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
          </motion.div>

          <motion.nav
            aria-label={dictionary.nav.navigation}
            variants={reduceMotion ? undefined : headerNavGroupVariants}
            className="ml-2 hidden items-center gap-6 xl:ml-6 xl:flex xl:gap-[30px]"
          >
            {navItems.map((item, index) => {
              const active = isNavActive(pathname, item.href, locale);
              return (
                <motion.div
                  key={`${item.href}-${item.label}`}
                  variants={reduceMotion ? undefined : headerNavLinkVariants}
                  custom={index}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  transition={{ duration: 0.25, ease: HEADER_EASE }}
                  className="relative"
                >
                  <AppLink
                    href={item.href}
                    prefetchPolicy="intent"
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "relative text-base font-semibold whitespace-nowrap text-brand transition hover:text-brand"
                        : "relative text-base font-semibold whitespace-nowrap text-white/90 transition hover:text-white"
                    }
                  >
                    {item.label}
                    {active ? (
                      <motion.span
                        layoutId="header-nav-underline"
                        className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-brand"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 28,
                        }}
                      />
                    ) : null}
                  </AppLink>
                </motion.div>
              );
            })}
          </motion.nav>

          <motion.div
            variants={reduceMotion ? undefined : headerItemVariants}
            className="ml-auto flex items-center gap-2 sm:gap-3"
          >
            <motion.div
              variants={reduceMotion ? undefined : headerItemVariants}
              whileHover={reduceMotion ? undefined : { scale: 1.03 }}
            >
              <HeaderSearch
                locale={locale}
                searchLabel={dictionary.header.search}
                placeholder={dictionary.header.searchPlaceholder}
                loadingLabel={dictionary.header.searchLoading}
                emptyLabel={dictionary.header.searchNoResults}
                seeAllLabel={dictionary.header.searchSeeAll}
              />
            </motion.div>

            <div className="hidden items-center gap-2 md:flex md:gap-[7px]">
              <motion.div
                variants={reduceMotion ? undefined : headerItemVariants}
                whileHover={reduceMotion ? undefined : { y: -2, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <HeaderCartButton
                  locale={locale}
                  currency={currency}
                  dictionary={dictionary}
                  itemCount={cartItemCount}
                  totalFormatted={cartTotalFormatted}
                />
              </motion.div>

              <motion.div
                variants={reduceMotion ? undefined : headerItemVariants}
                whileHover={reduceMotion ? undefined : { rotate: -8, scale: 1.06 }}
                transition={{ type: "spring", stiffness: 340, damping: 16 }}
              >
                <WishlistHeaderLink
                  locale={locale}
                  label={dictionary.nav.wishlist}
                  count={wishlistCount}
                  className="inline-flex size-12 items-center justify-center rounded-full bg-white text-brand shadow-sm transition hover:bg-white/90"
                  iconClassName="size-7 fill-brand"
                />
              </motion.div>

              <motion.div variants={reduceMotion ? undefined : headerItemVariants}>
                <LocaleCurrencySwitcher
                  locale={locale}
                  currency={currency}
                  currencyLabel={dictionary.header.currency}
                  languageLabel={dictionary.header.language}
                  variant="degusto"
                />
              </motion.div>

              <motion.div
                variants={reduceMotion ? undefined : headerItemVariants}
                whileHover={reduceMotion ? undefined : { scale: 1.06 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              >
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
                      src={staticAssetUrl("/assets/brand/account-arrow-up.webp")}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 translate-x-0.5 -translate-y-0.5 object-contain"
                      aria-hidden
                    />
                  }
                />
              </motion.div>
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
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.header>
  );
}

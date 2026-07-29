"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

type MobileBottomNavProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  cartItemCount: number;
  wishlistCount: number;
  isSignedIn: boolean;
};

function isHomePath(pathname: string, locale: Locale): boolean {
  return pathname === `/${locale}` || pathname === `/${locale}/`;
}

function startsWithPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

function isShopPath(pathname: string, locale: Locale): boolean {
  return startsWithPath(pathname, `/${locale}/products`);
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="absolute -top-1.5 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-semibold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * Curved dock mobile bottom nav matching live degusto-am.
 */
export function MobileBottomNav({
  locale,
  currency,
  dictionary,
  cartItemCount,
  wishlistCount,
  isSignedIn,
}: MobileBottomNavProps) {
  const pathname = usePathname() ?? `/${locale}`;
  const onHome = isHomePath(pathname, locale);
  const onShop = isShopPath(pathname, locale);
  const onWishlist = startsWithPath(pathname, `/${locale}/wishlist`);
  const onProfile =
    startsWithPath(pathname, `/${locale}/profile`) ||
    startsWithPath(pathname, `/${locale}/login`);
  const profileHref = isSignedIn
    ? `/${locale}/profile`
    : `/${locale}/login`;

  const cartInactiveClass = onShop
    ? "mobile-bottom-nav-fill-cart-shop-inactive"
    : "mobile-bottom-nav-fill-cart-home-inactive";
  const favInactiveClass = onShop
    ? "mobile-bottom-nav-fill-fav-shop-inactive"
    : "mobile-bottom-nav-fill-fav-home-inactive";
  const favActiveClass = onShop
    ? "mobile-bottom-nav-fill-fav-shop"
    : "mobile-bottom-nav-fill-fav-home";

  return (
    <div
      className="mobile-bottom-nav pointer-events-none fixed bottom-0 left-1/2 z-40 h-[calc(159px+env(safe-area-inset-bottom))] w-[375px] max-w-full -translate-x-1/2 pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-hidden={false}
    >
      <Image
        src={staticAssetUrl("/assets/mobile/nav/dock.webp")}
        alt=""
        width={375}
        height={80}
        className="absolute bottom-0 left-0 h-20 w-[375px] max-w-none object-cover"
        aria-hidden
        priority
      />

      <AppLink
        href={`/${locale}/products`}
        prefetchPolicy="intent"
        aria-label={dictionary.nav.shop}
        className="pointer-events-auto absolute top-10 left-1/2 inline-flex size-[70px] -translate-x-1/2 items-center justify-center"
      >
        <Image
          src={staticAssetUrl("/assets/mobile/nav/shop-disc.webp")}
          alt=""
          width={70}
          height={70}
          className="mobile-bottom-nav-shop-disc size-[70px] object-contain"
          aria-hidden
        />
      </AppLink>

      <nav
        aria-label={dictionary.nav.navigation}
        className="pointer-events-auto absolute bottom-[25px] left-1/2 flex -translate-x-1/2 items-start"
      >
        <AppLink
          href={`/${locale}`}
          prefetchPolicy="intent"
          aria-current={onHome ? "page" : undefined}
          aria-label={dictionary.nav.home}
          className={
            onHome
              ? "mobile-bottom-nav-item-active inline-flex h-[30px] w-[71px] items-center justify-center"
              : "inline-flex h-[30px] w-[71px] items-center justify-center"
          }
        >
          <span className="relative inline-flex size-[30px] items-center justify-center">
            <span
              className={
                onHome
                  ? "mobile-bottom-nav-fill-home-active"
                  : "mobile-bottom-nav-fill-home-inactive"
              }
              role="img"
              aria-hidden
            />
          </span>
        </AppLink>

        <CartDrawer
          locale={locale}
          currency={currency}
          dictionary={dictionary}
          itemCount={cartItemCount}
          renderTrigger={({
            open,
            badgeCount,
            label,
            openDrawer,
            prefetchDrawerView,
          }) => (
            <button
              type="button"
              onClick={openDrawer}
              onPointerEnter={prefetchDrawerView}
              onFocus={prefetchDrawerView}
              aria-label={label}
              aria-expanded={open}
              className="inline-flex h-[30px] w-[71px] items-start"
            >
              <span className="relative inline-flex h-[30px] w-[71px] items-start">
                <span
                  data-cart-fly-target="true"
                  className={
                    open
                      ? onShop
                        ? "mobile-bottom-nav-fill-cart-shop"
                        : "mobile-bottom-nav-fill-cart-home"
                      : cartInactiveClass
                  }
                  role="img"
                  aria-hidden
                />
                <NavBadge count={badgeCount} />
              </span>
            </button>
          )}
        />

        <span className="inline-flex h-6 w-[71px]" aria-hidden />

        <AppLink
          href={`/${locale}/wishlist`}
          prefetchPolicy="intent"
          aria-current={onWishlist ? "page" : undefined}
          aria-label={dictionary.nav.wishlist}
          className="inline-flex h-[30px] w-[71px] items-start"
        >
          <span className="relative inline-flex h-[30px] w-[71px] items-start">
            <span
              className={onWishlist ? favActiveClass : favInactiveClass}
              role="img"
              aria-hidden
            />
            <NavBadge count={wishlistCount} />
          </span>
        </AppLink>

        <AppLink
          href={profileHref}
          prefetchPolicy="intent"
          aria-current={onProfile ? "page" : undefined}
          aria-label={
            isSignedIn
              ? dictionary.header.profile
              : dictionary.header.login
          }
          className="inline-flex h-[30px] w-[71px] items-center justify-center"
        >
          <span
            className={
              onProfile
                ? "mobile-bottom-nav-fill-profile-active"
                : "mobile-bottom-nav-fill-profile-inactive"
            }
            role="img"
            aria-hidden
          />
        </AppLink>
      </nav>
    </div>
  );
}

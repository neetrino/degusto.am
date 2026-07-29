import { Suspense } from "react";

import { SiteHeaderMainNav } from "@/components/layout/SiteHeaderMainNav";
import { SiteHeaderShell } from "@/components/layout/SiteHeaderShell";
import { getCartDrawerView } from "@/features/cart/get-cart-drawer-view";
import { getWishlistCount } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { createDisplayPriceFormatter } from "@/lib/money/display-price";

type SiteHeaderProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
};

function HeaderControlsFallback() {
  return (
    <header className="pointer-events-auto relative z-40 px-3 pt-4 sm:px-6 md:px-8 md:pt-6">
      <div className="mx-auto flex h-16 max-w-[1374px] items-center justify-between rounded-full bg-black px-5 sm:h-20">
        <div className="h-8 w-28" aria-hidden="true" />
        <div
          className="h-10 w-28 animate-pulse rounded-full bg-white/10"
          aria-hidden="true"
        />
      </div>
    </header>
  );
}

async function SiteHeaderMainNavAsync({
  locale,
  currency,
  dictionary,
}: SiteHeaderProps) {
  const navItems = [
    { href: `/${locale}`, label: dictionary.nav.home },
    { href: `/${locale}/products`, label: dictionary.nav.shop },
    { href: `/${locale}/combo`, label: dictionary.nav.combos },
    { href: `/${locale}/about`, label: dictionary.nav.about },
  ] as const;

  const [user, cartView, wishlistCount, formatPrice] = await Promise.all([
    getCurrentUser(),
    getCartDrawerView(locale, currency),
    getWishlistCount(),
    createDisplayPriceFormatter(locale, currency),
  ]);

  const emptyTotal = formatPrice(0).formatted;
  const cartTotalFormatted =
    cartView.itemCount > 0 ? cartView.totalFormatted : emptyTotal;

  return (
    <SiteHeaderMainNav
      locale={locale}
      currency={currency}
      dictionary={dictionary}
      user={user}
      navItems={navItems}
      cartItemCount={cartView.itemCount}
      cartTotalFormatted={cartTotalFormatted}
      wishlistCount={wishlistCount}
    />
  );
}

/**
 * Storefront chrome: Degusto pill header streams account/cart/wishlist
 * in a Suspense island so page content is not blocked.
 * Hidden on home mobile where HomeMobile renders its own chrome.
 */
export function SiteHeader({ locale, currency, dictionary }: SiteHeaderProps) {
  return (
    <SiteHeaderShell locale={locale}>
      <Suspense
        fallback={<HeaderControlsFallback />}
      >
        <SiteHeaderMainNavAsync
          locale={locale}
          currency={currency}
          dictionary={dictionary}
        />
      </Suspense>
    </SiteHeaderShell>
  );
}

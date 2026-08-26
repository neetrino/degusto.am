"use client";

import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

const CART_BADGE_BG = "#F5C518";

function HeaderCartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 text-white"
      fill="currentColor"
      aria-hidden
    >
      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 20 4H5.21l-.94-2H1z" />
    </svg>
  );
}

type HeaderCartButtonProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  itemCount: number;
  totalFormatted: string;
};

/** Formats money for the header cart pill (e.g. `9 800֏`). */
function toDramLabel(totalFormatted: string): string {
  const withoutCurrency = totalFormatted
    .replace(/\s*AMD\b/gi, "")
    .replace(/[֏Դ]/g, "")
    .trim();
  const digits = withoutCurrency.replace(/[^\d]/g, "");
  if (!digits) {
    return `${withoutCurrency}֏`.trim();
  }
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped}֏`;
}

/** Degusto header cart — brand pill with cart badge + total. */
export function HeaderCartButton({
  locale,
  currency,
  dictionary,
  itemCount,
  totalFormatted,
}: HeaderCartButtonProps) {
  const priceLabel = toDramLabel(totalFormatted);

  return (
    <CartDrawer
      locale={locale}
      currency={currency}
      dictionary={dictionary}
      itemCount={itemCount}
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
          className="inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-brand px-3.5 pr-4 text-white shadow-[0_6px_18px_rgba(246,104,18,0.28)] transition hover:bg-brand-strong"
          aria-label={`${label}, ${priceLabel}`}
          aria-expanded={open}
        >
          <span
            data-cart-fly-target="true"
            className="relative inline-flex size-7 shrink-0 items-center justify-center"
          >
            <HeaderCartIcon />
            <span
              aria-hidden
              className="pointer-events-none absolute -top-1.5 -right-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] leading-none font-bold text-black tabular-nums shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
              style={{ backgroundColor: CART_BADGE_BG }}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          </span>
          <span
            aria-hidden
            className="text-base font-bold whitespace-nowrap tabular-nums"
          >
            {priceLabel}
          </span>
        </button>
      )}
    />
  );
}

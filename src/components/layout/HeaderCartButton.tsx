"use client";

import { ShoppingCart } from "lucide-react";

import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type HeaderCartButtonProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  itemCount: number;
  totalFormatted: string;
};

/** Degusto header cart: orange cart glyph, count badge and white price pill. */
export function HeaderCartButton({
  locale,
  currency,
  dictionary,
  itemCount,
  totalFormatted,
}: HeaderCartButtonProps) {
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
          className="relative inline-flex h-12 w-[117px] items-center"
          aria-label={label}
          aria-expanded={open}
        >
          <span className="absolute top-0 right-0 flex h-12 w-[88px] items-center justify-center rounded-full bg-white pl-5 text-base font-bold text-black tabular-nums">
            {totalFormatted}
          </span>
          <span className="relative z-10 ml-2 inline-flex size-[45px] items-center justify-center">
            <ShoppingCart
              className="size-9 fill-brand text-brand"
              aria-hidden
              strokeWidth={1.5}
            />
            <span className="absolute -top-0.5 right-0 flex size-6 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          </span>
        </button>
      )}
    />
  );
}

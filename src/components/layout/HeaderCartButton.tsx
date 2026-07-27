"use client";

import Image from "next/image";

import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

const CART_ICON = "/assets/brand/cart-icon.webp";
const BADGE_CIRCLE = "/assets/brand/avatar-circle.webp";

type HeaderCartButtonProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  itemCount: number;
  totalFormatted: string;
};

function toDramLabel(totalFormatted: string): string {
  return totalFormatted.replace(/\s*AMD\b/g, " Դ").trim();
}

/** Degusto header cart — live degusto-am cart icon + white price pill. */
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
          className="relative inline-flex h-12 shrink-0 items-end"
          aria-label={`${label}, ${priceLabel}`}
          aria-expanded={open}
        >
          <span
            data-cart-fly-target="true"
            className="relative z-[2] mb-px inline-flex h-[34px] w-[37px] shrink-0 items-center justify-center"
          >
            <Image
              src={CART_ICON}
              alt=""
              width={37}
              height={34}
              className="h-[34px] w-[37px] object-contain"
              aria-hidden
            />
            <span
              aria-hidden
              className="pointer-events-none absolute top-[-2px] left-[27px] inline-flex size-6 items-center justify-center"
            >
              <Image
                src={BADGE_CIRCLE}
                alt=""
                width={24}
                height={24}
                className="absolute size-6 object-contain"
              />
              <span className="relative text-sm leading-6 font-bold text-white">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            </span>
          </span>
          <span
            aria-hidden
            className="relative z-[1] -ml-[21px] inline-flex h-12 min-w-[88px] shrink-0 items-center justify-center rounded-[70px] bg-white pr-3 pl-9 text-base font-bold whitespace-nowrap text-black tabular-nums"
          >
            {priceLabel}
          </span>
        </button>
      )}
    />
  );
}

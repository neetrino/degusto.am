"use client";

import Image from "next/image";

import { CartDrawer } from "@/features/cart/ui/CartDrawer";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

const BADGE_CIRCLE = staticAssetUrl("/assets/brand/avatar-circle.webp");

function HeaderCartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[34px] w-[37px] -translate-y-1 text-[#F66812]"
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
            className="relative z-[2] mb-px inline-flex h-[34px] w-[37px] shrink-0 translate-x-1 items-center justify-center"
          >
            <HeaderCartIcon />
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

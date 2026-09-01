"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addToCart } from "@/features/cart/cart";
import {
  beginCartMutation,
  endCartMutation,
  optimisticAddToCartLocal,
  replaceCartLocalFromServer,
  type CartProductSnapshot,
} from "@/features/cart/client/cart-local-cache";
import { loadCartDrawerViewAction } from "@/features/cart/load-cart-drawer-view-action";
import { WishlistButton } from "@/features/wishlist/ui/WishlistButton";
import type { Locale } from "@/lib/i18n/config";
import {
  CURRENCY_COOKIE_NAME,
  parseCurrencyCookie,
} from "@/lib/money/currency-cookie";
import type { Currency } from "@/lib/money/currency";

type ProductPurchaseControlsProps = {
  locale: Locale;
  productId: string;
  stockOnHand: number;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  inWishlist: boolean;
  isSignedIn: boolean;
  wishlistLabel: string;
  snapshot: Omit<CartProductSnapshot, "productId">;
  labels: {
    quantity: string;
    decreaseQuantity: string;
    increaseQuantity: string;
    addToCart: string;
    adding: string;
    outOfStock: string;
    added: string;
    error: string;
  };
};

function readClientCurrency(): Currency {
  if (typeof document === "undefined") {
    return parseCurrencyCookie(undefined);
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CURRENCY_COOKIE_NAME}=([^;]*)`),
  );
  return parseCurrencyCookie(
    match?.[1] ? decodeURIComponent(match[1]) : undefined,
  );
}

/** PDP qty + cart + wishlist — Degusto orange pill controls. */
export function ProductPurchaseControls({
  locale,
  productId,
  stockOnHand,
  quantity,
  onQuantityChange,
  inWishlist,
  isSignedIn,
  wishlistLabel,
  snapshot,
  labels,
}: ProductPurchaseControlsProps) {
  const router = useRouter();
  const maxQty = Math.max(stockOnHand, 0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const disabled = maxQty < 1;

  function changeQuantity(next: number): void {
    if (disabled) return;
    onQuantityChange(Math.min(Math.max(1, next), maxQty));
    setMessage(null);
    setError(null);
  }

  function handleAdd(): void {
    if (disabled || quantity < 1) return;
    setMessage(null);
    setError(null);
    const currency = readClientCurrency();

    startTransition(async () => {
      beginCartMutation();
      try {
        optimisticAddToCartLocal(
          { productId, ...snapshot },
          quantity,
          locale,
          currency,
        );
        await addToCart(productId, quantity);
        setMessage(labels.added);
        router.refresh();
      } catch {
        setError(labels.error);
      } finally {
        endCartMutation();
      }

      try {
        const next = await loadCartDrawerViewAction(locale, currency);
        replaceCartLocalFromServer(next, locale, currency);
      } catch {
        // Keep optimistic cache; next drawer open will resync.
      }
    });
  }

  return (
    <div className="mt-8 mb-4 flex w-full min-w-0 flex-col gap-2.5 lg:mt-32 lg:flex-row lg:items-center lg:gap-2.5">
      <div className="flex w-full min-w-0 items-center gap-2.5 lg:contents">
        <div
          className="inline-flex h-12 max-lg:w-[7.25rem] max-lg:px-2.5 lg:w-[10.0625rem] lg:px-3.5 shrink-0 items-center justify-between rounded-[70px] border-2 border-[#ff7f20] bg-white"
          role="group"
          aria-label={labels.quantity}
        >
          <button
            type="button"
            aria-label={labels.decreaseQuantity}
            disabled={disabled || quantity <= 1 || pending}
            onClick={() => changeQuantity(quantity - 1)}
            className="flex size-8 shrink-0 items-center justify-center text-[#ff7f20] disabled:pointer-events-none disabled:opacity-35"
          >
            <Minus className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
          <span className="min-w-[1.75rem] select-none text-center text-lg font-medium tabular-nums text-[#ff7f20]">
            {quantity}
          </span>
          <button
            type="button"
            aria-label={labels.increaseQuantity}
            disabled={disabled || quantity >= maxQty || pending}
            onClick={() => changeQuantity(quantity + 1)}
            className="flex size-8 shrink-0 items-center justify-center text-[#ff7f20] disabled:pointer-events-none disabled:opacity-35"
          >
            <Plus className="size-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          disabled={disabled || pending}
          onClick={handleAdd}
          className="flex h-12 min-w-0 max-lg:flex-1 items-center justify-center rounded-[70px] bg-[#ff7f20] text-base font-medium whitespace-nowrap text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500 lg:w-[16.25rem] lg:shrink-0"
        >
          {disabled
            ? labels.outOfStock
            : pending
              ? labels.adding
              : labels.addToCart}
        </button>

        <WishlistButton
          locale={locale}
          productId={productId}
          initialInWishlist={inWishlist}
          isSignedIn={isSignedIn}
          label={wishlistLabel}
          className="size-12 shrink-0 overflow-hidden rounded-[70px] border-0 bg-[#e4e4e4] text-[#494949] transition-opacity hover:opacity-80"
        />
      </div>

      {message ? (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

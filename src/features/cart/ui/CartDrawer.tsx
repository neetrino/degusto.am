"use client";

import { useState, useTransition } from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { SideSheet } from "@/components/ui/SideSheet";
import { removeItem, updateQuantity } from "@/features/cart/cart";
import {
  beginCartMutation,
  endCartMutation,
  optimisticRemoveLocal,
  optimisticSetQuantityLocal,
  replaceCartLocalFromServer,
  toCartDrawerView,
} from "@/features/cart/client/cart-local-cache";
import { useCartLocalView } from "@/features/cart/client/use-cart-local-cache";
import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";
import { loadCartDrawerViewAction } from "@/features/cart/load-cart-drawer-view-action";
import { CartDrawerLineList } from "@/features/cart/ui/CartDrawerLineList";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import type { Currency } from "@/lib/money/currency";

type CartDrawerTriggerArgs = {
  open: boolean;
  badgeCount: number;
  label: string;
  openDrawer: () => void;
  prefetchDrawerView: () => void;
};

type CartDrawerProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  itemCount: number;
  /** Custom trigger (e.g. mobile bottom nav). Defaults to header cart button. */
  renderTrigger?: (args: CartDrawerTriggerArgs) => React.ReactNode;
};

function formatItemCount(
  count: number,
  labels: Dictionary["cartDrawer"],
): string {
  if (count === 1) {
    return labels.itemsOne;
  }
  return labels.itemsMany.replace("{count}", String(count));
}

export function CartDrawer({
  locale,
  currency,
  dictionary,
  itemCount,
  renderTrigger,
}: CartDrawerProps) {
  const [open, setOpen] = useState(false);
  const [serverView, setServerView] = useState<CartDrawerView | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [pending, startTransition] = useTransition();
  const localView = useCartLocalView(locale, currency);
  const labels = dictionary.cartDrawer;

  const displayView: CartDrawerView | null = localView
    ? toCartDrawerView(localView)
    : serverView;
  const badgeCount = Math.max(
    displayView?.itemCount ?? 0,
    itemCount,
    localView?.itemCount ?? 0,
  );
  const hasItems = Boolean(displayView && displayView.items.length > 0);

  function applyServerView(next: CartDrawerView, force = false): void {
    setServerView(next);
    replaceCartLocalFromServer(next, locale, currency, { force });
  }

  function fetchDrawerView(): void {
    setLoadingView(true);
    startTransition(async () => {
      try {
        const next = await loadCartDrawerViewAction(locale, currency);
        applyServerView(next);
      } finally {
        setLoadingView(false);
      }
    });
  }

  function prefetchDrawerView(): void {
    if (displayView || loadingView || open) {
      return;
    }
    fetchDrawerView();
  }

  function openDrawer(): void {
    setOpen(true);
    fetchDrawerView();
  }

  function changeQuantity(itemId: string, quantity: number): void {
    beginCartMutation();
    optimisticSetQuantityLocal(itemId, quantity, locale, currency);
    startTransition(async () => {
      try {
        if (itemId.startsWith("local:")) {
          const productId = itemId.slice("local:".length);
          let next = await loadCartDrawerViewAction(locale, currency);
          const durable = next.items.find((item) => item.productId === productId);
          if (durable && durable.quantity !== quantity) {
            await updateQuantity(durable.id, quantity);
            next = await loadCartDrawerViewAction(locale, currency);
          }
          applyServerView(next, true);
          return;
        }
        await updateQuantity(itemId, quantity);
        applyServerView(await loadCartDrawerViewAction(locale, currency), true);
      } catch {
        // Keep optimistic quantity until the next successful sync.
      } finally {
        endCartMutation();
      }
    });
  }

  function removeCartItem(itemId: string): void {
    beginCartMutation();
    optimisticRemoveLocal(itemId, locale, currency);
    startTransition(async () => {
      try {
        if (itemId.startsWith("local:")) {
          const productId = itemId.slice("local:".length);
          const next = await loadCartDrawerViewAction(locale, currency);
          const durable = next.items.find((item) => item.productId === productId);
          if (durable) {
            await removeItem(durable.id);
            applyServerView(
              await loadCartDrawerViewAction(locale, currency),
              true,
            );
          } else {
            applyServerView(next, true);
          }
          return;
        }
        await removeItem(itemId);
        applyServerView(await loadCartDrawerViewAction(locale, currency), true);
      } catch {
        // Keep optimistic removal until the next successful sync.
      } finally {
        endCartMutation();
      }
    });
  }

  return (
    <>
      <SideSheet
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel={labels.title}
        panelClassName="w-[87%] max-w-[420px]"
        zIndexClassName="z-[10000]"
        backdropBlur
        closeTone="brand"
      >
        <div className="relative overflow-hidden border-b border-[#ff7f20]/15 px-6 py-5">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#ff7f20] via-[#ffb067] to-transparent"
            aria-hidden
          />
          <h2 className="text-xl font-bold tracking-tight text-[#3c2f2f]">
            {labels.title}
          </h2>
          {hasItems ? (
            <p className="mt-1.5 inline-flex items-center gap-2 text-sm text-[#717182]">
              <span className="cart-badge-pop inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff7f20] px-1.5 text-[11px] font-bold text-white">
                {badgeCount}
              </span>
              {formatItemCount(badgeCount, labels)}
            </p>
          ) : null}
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 transition-opacity duration-300 ${
            pending || loadingView ? "opacity-60" : "opacity-100"
          }`}
        >
          {loadingView && !hasItems ? (
            <div className="space-y-3">
              <div className="h-24 animate-pulse rounded-[20px] bg-[#fff4eb]" />
              <div className="h-24 animate-pulse rounded-[20px] bg-[#fff4eb]" />
            </div>
          ) : !displayView || displayView.items.length === 0 ? (
            <div className="cart-enter flex h-full min-h-[280px] flex-col items-center justify-center px-2 text-center">
              <div className="relative flex size-28 items-center justify-center">
                <span
                  className="cart-soft-pulse absolute inset-0 rounded-full bg-[#ff7f20]/15"
                  aria-hidden
                />
                <span className="cart-float relative flex size-[5.25rem] items-center justify-center rounded-full bg-[#fff4eb] text-[#ff7f20] shadow-[0_10px_24px_rgba(255,127,32,0.2)]">
                  <ShoppingCart className="h-11 w-11" aria-hidden />
                </span>
              </div>
              <p className="cart-enter cart-enter-delay-1 mt-5 text-xl font-bold text-[#3c2f2f]">
                {labels.empty}
              </p>
              <p className="cart-enter cart-enter-delay-2 mt-2 max-w-[20rem] text-sm leading-relaxed text-[#717182]">
                {labels.emptyDescription}
              </p>
              <AppLink
                href={`/${locale}/products`}
                prefetchPolicy="intent"
                onClick={() => setOpen(false)}
                className="cart-enter cart-enter-delay-3 cart-cta-shine group relative mt-6 inline-flex min-h-[50px] w-full max-w-sm items-center overflow-hidden rounded-full bg-[#ff7f20] py-1.5 pr-1.5 pl-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,127,32,0.32)] transition-[transform,filter] duration-300 hover:-translate-y-0.5 hover:brightness-[1.03] motion-reduce:hover:translate-y-0"
              >
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center px-12">
                  {labels.emptyCta}
                </span>
                <span className="relative ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </AppLink>
            </div>
          ) : (
            <CartDrawerLineList
              items={displayView.items}
              labels={labels}
              pending={pending}
              onChangeQuantity={changeQuantity}
              onRemove={removeCartItem}
            />
          )}
        </div>

        <div className="border-t border-[#ff7f20]/12 bg-gradient-to-t from-[#fff8f1] to-white px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-[#717182]">
              <dt>{labels.subtotal}</dt>
              <dd className="tabular-nums font-medium text-[#3c2f2f]">
                {displayView?.subtotalFormatted ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-1 text-base font-bold text-[#3c2f2f]">
              <dt>{labels.total}</dt>
              <dd className="tabular-nums text-[#ff7f20]">
                {displayView?.totalFormatted ?? "—"}
              </dd>
            </div>
          </dl>

          {hasItems ? (
            <AppLink
              href={`/${locale}/checkout`}
              prefetchPolicy="intent"
              className="cart-cta-shine group relative mt-5 flex min-h-[50px] w-full items-center overflow-hidden rounded-full bg-[#ff7f20] py-1.5 pr-1.5 pl-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,127,32,0.35)] transition-[transform,filter] duration-300 hover:-translate-y-0.5 hover:brightness-[1.03] motion-reduce:hover:translate-y-0"
              onClick={() => setOpen(false)}
            >
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center pr-12 pl-4">
                {labels.checkout}
              </span>
              <span className="relative ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </AppLink>
          ) : null}
        </div>
      </SideSheet>

      {renderTrigger ? (
        renderTrigger({
          open,
          badgeCount,
          label: dictionary.nav.cart,
          openDrawer,
          prefetchDrawerView,
        })
      ) : (
        <button
          type="button"
          onClick={openDrawer}
          onPointerEnter={prefetchDrawerView}
          onFocus={prefetchDrawerView}
          className="inline-flex h-11 items-center gap-1 rounded-lg px-1 text-gray-700 transition-colors hover:text-gray-900"
          aria-label={dictionary.nav.cart}
          aria-expanded={open}
        >
          <span className="relative inline-flex h-11 w-11 items-center justify-center">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {badgeCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-semibold text-white">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : null}
          </span>
        </button>
      )}
    </>
  );
}

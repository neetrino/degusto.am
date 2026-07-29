"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ArrowRight, Minus, Plus, ShoppingCart, X } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { SideSheet } from "@/components/ui/SideSheet";
import { removeItem, updateQuantity } from "@/features/cart/cart";
import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";
import { loadCartDrawerViewAction } from "@/features/cart/load-cart-drawer-view-action";
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
  const [view, setView] = useState<CartDrawerView | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [pending, startTransition] = useTransition();
  const labels = dictionary.cartDrawer;
  // Ignore cached drawer payload when it disagrees with the server badge
  // (stale empty prefetch after addToCart would otherwise hide line items).
  const syncedView =
    view && view.itemCount === itemCount ? view : null;
  const badgeCount = syncedView?.itemCount ?? itemCount;
  const hasItems = Boolean(syncedView && syncedView.items.length > 0);

  function fetchDrawerView(): void {
    setLoadingView(true);
    startTransition(async () => {
      const next = await loadCartDrawerViewAction(locale, currency);
      setView(next);
      setLoadingView(false);
    });
  }

  function prefetchDrawerView(): void {
    if (syncedView || loadingView || open) {
      return;
    }
    fetchDrawerView();
  }

  function openDrawer(): void {
    setOpen(true);
    // Always reload on open so adds from product cards/PDP are visible.
    fetchDrawerView();
  }

  function closeDrawer(): void {
    setOpen(false);
  }

  function changeQuantity(itemId: string, quantity: number): void {
    startTransition(async () => {
      await updateQuantity(itemId, quantity);
      const next = await loadCartDrawerViewAction(locale, currency);
      setView(next);
    });
  }

  function removeCartItem(itemId: string): void {
    startTransition(async () => {
      await removeItem(itemId);
      const next = await loadCartDrawerViewAction(locale, currency);
      setView(next);
    });
  }

  return (
    <>
      <SideSheet
        open={open}
        onClose={closeDrawer}
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
          ) : !syncedView || syncedView.items.length === 0 ? (
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
                onClick={closeDrawer}
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
            <ul className="cart-line-stagger space-y-3">
              {syncedView.items.map((item) => (
                <li
                  key={item.id}
                  className="group rounded-[20px] border border-[#dedede] bg-white p-3 shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-[#ff7f20]/40 hover:shadow-[0_12px_28px_rgba(255,127,32,0.12)] motion-reduce:hover:translate-y-0"
                >
                  <div className="flex gap-3">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#f7f7f7]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="96px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-[#a1a1a1]">
                          —
                        </div>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-bold text-[#3c2f2f]">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm font-black text-[#3c2f2f]">
                            {item.lineTotalFormatted}
                          </p>
                          <p className="mt-0.5 text-xs text-[#717182]">
                            {item.unitPriceFormatted} × {item.quantity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f3f3f3] text-[#717182] transition-[transform,background-color,color] duration-300 hover:scale-105 hover:bg-[#ffe8d9] hover:text-[#ff7f20] active:scale-95"
                          aria-label={labels.removeItem}
                          disabled={pending}
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      </div>

                      <div className="mt-auto flex justify-end pt-3">
                        <div className="inline-flex items-center gap-1 rounded-full border-2 border-[#ff7f20] bg-white px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(item.id, item.quantity - 1)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[#ff7f20] transition-[transform,background-color] hover:bg-[#fff4eb] active:scale-90"
                            aria-label={labels.decreaseQuantity}
                            disabled={pending}
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <span className="min-w-5 text-center text-sm font-semibold tabular-nums text-[#ff7f20]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              changeQuantity(item.id, item.quantity + 1)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[#ff7f20] transition-[transform,background-color] hover:bg-[#fff4eb] active:scale-90"
                            aria-label={labels.increaseQuantity}
                            disabled={pending}
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[#ff7f20]/12 bg-gradient-to-t from-[#fff8f1] to-white px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-[#717182]">
              <dt>{labels.subtotal}</dt>
              <dd className="tabular-nums font-medium text-[#3c2f2f]">
                {syncedView?.subtotalFormatted ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between text-[#717182]">
              <dt>{labels.shipping}</dt>
              <dd className="tabular-nums font-medium text-[#3c2f2f]">
                {syncedView?.shippingFormatted ?? "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between pt-1 text-base font-bold text-[#3c2f2f]">
              <dt>{labels.total}</dt>
              <dd className="tabular-nums text-[#ff7f20]">
                {syncedView?.totalFormatted ?? "—"}
              </dd>
            </div>
          </dl>

          {hasItems ? (
            <AppLink
              href={`/${locale}/checkout`}
              prefetchPolicy="intent"
              className="cart-cta-shine group relative mt-5 flex min-h-[50px] w-full items-center overflow-hidden rounded-full bg-[#ff7f20] py-1.5 pr-1.5 pl-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(255,127,32,0.35)] transition-[transform,filter] duration-300 hover:-translate-y-0.5 hover:brightness-[1.03] motion-reduce:hover:translate-y-0"
              onClick={closeDrawer}
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

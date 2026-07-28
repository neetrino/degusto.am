import Image from "next/image";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import { CartEmptyState } from "@/features/cart/ui/CartEmptyState";
import { removeItem, updateQuantity } from "@/features/cart/cart";
import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";

type CartPanelProps = {
  locale: Locale;
  view: CartDrawerView;
  labels: Dictionary["cartDrawer"];
  shopHref: string;
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

/** Storefront cart page — Degusto motion, cards, and summary. */
export function CartPanel({
  locale,
  view,
  labels,
  shopHref,
}: CartPanelProps) {
  const hasItems = view.items.length > 0;

  return (
    <section
      data-cart-page
      className="relative mx-auto w-full max-w-[min(1100px,calc(100%-0.5rem))] pb-12 lg:pb-16"
    >
      <div
        className="pointer-events-none absolute -top-10 left-1/2 h-56 w-[min(100%,42rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,127,32,0.14),transparent_70%)] blur-2xl"
        aria-hidden
      />

      <header className="cart-enter relative mb-7 flex flex-col gap-2 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[2.15rem] leading-[1.1] font-bold text-[#3c2f2f] lg:text-[2.75rem]">
            {labels.title}
          </h1>
          {hasItems ? (
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-[#717182] lg:text-base">
              <span className="cart-badge-pop inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#ff7f20] px-2 text-xs font-bold text-white">
                {view.itemCount}
              </span>
              {formatItemCount(view.itemCount, labels)}
            </p>
          ) : null}
        </div>
      </header>

      {!hasItems ? (
        <CartEmptyState
          title={labels.empty}
          description={labels.emptyDescription}
          ctaLabel={labels.emptyCta}
          ctaHref={shopHref}
        />
      ) : (
        <div className="relative grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,23rem)] lg:gap-8">
          <ul className="cart-line-stagger flex flex-col gap-3.5 sm:gap-4">
            {view.items.map((item) => (
              <li
                key={item.id}
                className="group relative overflow-hidden rounded-[26px] border border-[#dedede]/90 bg-white/95 p-3.5 shadow-[0_8px_28px_rgba(60,47,47,0.05)] transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[#ff7f20]/45 hover:shadow-[0_18px_40px_rgba(255,127,32,0.14)] sm:p-4 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 w-1 origin-top scale-y-0 bg-gradient-to-b from-[#ff7f20] to-[#ffb067] transition-transform duration-300 ease-out group-hover:scale-y-100"
                  aria-hidden
                />
                <div className="flex gap-3.5 sm:gap-4">
                  <div className="relative size-[5.75rem] shrink-0 overflow-hidden rounded-[20px] bg-[#f7f7f7] ring-1 ring-black/5 sm:size-[7.25rem]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="116px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
                        <p className="line-clamp-2 text-base leading-snug font-bold text-[#3c2f2f] sm:text-lg">
                          {item.title}
                        </p>
                        <p className="mt-1.5 text-lg font-black tracking-tight tabular-nums text-[#3c2f2f]">
                          {item.lineTotalFormatted}
                        </p>
                        <p className="mt-0.5 text-sm text-[#8a8a8a] tabular-nums">
                          {item.unitPriceFormatted} × {item.quantity}
                        </p>
                      </div>

                      <form
                        action={async () => {
                          "use server";
                          await removeItem(item.id);
                        }}
                      >
                        <button
                          type="submit"
                          aria-label={labels.removeItem}
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-[#8a8a8a] transition-[transform,background-color,color,box-shadow] duration-300 hover:scale-105 hover:bg-[#ffe8d9] hover:text-[#ff7f20] hover:shadow-md active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </form>
                    </div>

                    <div className="mt-auto flex items-center pt-3.5">
                      <div
                        className="inline-flex h-11 items-center justify-between gap-0.5 rounded-[70px] border-2 border-[#ff7f20] bg-white px-1.5 shadow-[inset_0_0_0_0_rgba(255,127,32,0.12)] transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_4px_rgba(255,127,32,0.08)]"
                        role="group"
                        aria-label={labels.decreaseQuantity}
                      >
                        <form
                          action={async () => {
                            "use server";
                            await updateQuantity(item.id, item.quantity - 1);
                          }}
                        >
                          <button
                            type="submit"
                            aria-label={labels.decreaseQuantity}
                            className="flex size-8 items-center justify-center rounded-full text-[#ff7f20] transition-[transform,background-color] hover:bg-[#fff4eb] active:scale-90"
                          >
                            <Minus
                              className="size-4"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          </button>
                        </form>
                        <span className="min-w-[1.85rem] text-center text-base font-bold tabular-nums text-[#ff7f20]">
                          {item.quantity}
                        </span>
                        <form
                          action={async () => {
                            "use server";
                            await updateQuantity(item.id, item.quantity + 1);
                          }}
                        >
                          <button
                            type="submit"
                            aria-label={labels.increaseQuantity}
                            className="flex size-8 items-center justify-center rounded-full text-[#ff7f20] transition-[transform,background-color] hover:bg-[#fff4eb] active:scale-90"
                          >
                            <Plus
                              className="size-4"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="cart-enter cart-enter-delay-2 lg:sticky lg:top-28">
            <div className="relative overflow-hidden rounded-[30px] border border-[#ff7f20]/20 bg-gradient-to-b from-[#fff8f1] to-white p-5 shadow-[0_16px_48px_rgba(255,127,32,0.12)] sm:p-6">
              <div
                className="pointer-events-none absolute -top-10 -right-8 size-36 rounded-full bg-[#ff7f20]/15 blur-2xl"
                aria-hidden
              />
              <h2 className="relative text-lg font-bold text-[#3c2f2f]">
                {labels.total}
              </h2>
              <dl className="relative mt-5 space-y-3.5 text-sm">
                <div className="flex items-center justify-between gap-3 text-[#717182]">
                  <dt>{labels.subtotal}</dt>
                  <dd className="font-semibold tabular-nums text-[#3c2f2f]">
                    {view.subtotalFormatted}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-[#717182]">
                  <dt>{labels.shipping}</dt>
                  <dd className="font-semibold tabular-nums text-[#3c2f2f]">
                    {view.shippingFormatted}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-[#ff7f20]/15 pt-3.5 text-base font-bold text-[#3c2f2f]">
                  <dt>{labels.total}</dt>
                  <dd className="text-2xl tracking-tight tabular-nums text-[#ff7f20]">
                    {view.totalFormatted}
                  </dd>
                </div>
              </dl>

              <AppLink
                href={`/${locale}/checkout`}
                prefetchPolicy="intent"
                className="cart-cta-shine group relative mt-6 flex min-h-12 w-full items-center overflow-hidden rounded-full bg-[#ff7f20] py-1.5 pr-1.5 pl-5 text-base font-semibold text-white shadow-[0_12px_30px_rgba(255,127,32,0.38)] transition-[transform,box-shadow,filter] duration-300 hover:-translate-y-0.5 hover:brightness-[1.03] hover:shadow-[0_18px_40px_rgba(255,127,32,0.45)] active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7f20] motion-reduce:hover:translate-y-0"
              >
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center pr-12 pl-4">
                  {labels.checkout}
                </span>
                <span className="relative ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-0.5">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </AppLink>

              <AppLink
                href={shopHref}
                prefetchPolicy="intent"
                className="mt-3 flex h-11 w-full items-center justify-center rounded-full border-2 border-[#ff7f20]/80 text-sm font-semibold text-[#ff7f20] transition-[transform,background-color,border-color] duration-300 hover:border-[#ff7f20] hover:bg-[#fff4eb] active:scale-[0.99]"
              >
                {labels.emptyCta}
              </AppLink>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

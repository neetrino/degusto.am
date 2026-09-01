"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";

import type { CartDrawerItemView } from "@/features/cart/get-cart-drawer-view";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

type CartDrawerLineListProps = {
  items: CartDrawerItemView[];
  labels: Dictionary["cartDrawer"];
  pending: boolean;
  onChangeQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
};

/** Cart drawer line items with qty controls. */
export function CartDrawerLineList({
  items,
  labels,
  pending,
  onChangeQuantity,
  onRemove,
}: CartDrawerLineListProps) {
  return (
    <ul className="cart-line-stagger space-y-3">
      {items.map((item) => (
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
                  onClick={() => onRemove(item.id)}
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
                    onClick={() => onChangeQuantity(item.id, item.quantity - 1)}
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
                    onClick={() => onChangeQuantity(item.id, item.quantity + 1)}
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
  );
}

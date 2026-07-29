"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";

import type { CheckoutOrderProduct } from "@/features/checkout/ui/checkout-order-product";
import { removeItem } from "@/features/cart/cart";
import {
  checkoutTileItem,
  checkoutTileStagger,
} from "@/features/checkout/ui/CheckoutMotion";

type CheckoutProductsInOrderProps = {
  products: CheckoutOrderProduct[];
  title: string;
  itemsOneLabel: string;
  itemsManyLabel: string;
  removeItemLabel: string;
  onCartChanged?: () => void;
};

function formatItemCount(
  count: number,
  itemsOneLabel: string,
  itemsManyLabel: string,
): string {
  if (count === 1) {
    return itemsOneLabel;
  }
  return itemsManyLabel.replace("{count}", String(count));
}

export function CheckoutProductsInOrder({
  products: initialProducts,
  title,
  itemsOneLabel,
  itemsManyLabel,
  removeItemLabel,
  onCartChanged,
}: CheckoutProductsInOrderProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [products, setProducts] = useState(initialProducts);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setProducts(initialProducts);
    });
    return () => {
      cancelled = true;
    };
  }, [initialProducts]);

  const itemCount = products.reduce((sum, product) => sum + product.quantity, 0);

  if (products.length === 0) {
    return null;
  }

  function onRemove(itemId: string): void {
    setProducts((current) => current.filter((product) => product.id !== itemId));
    onCartChanged?.();

    startTransition(async () => {
      await removeItem(itemId);
      router.refresh();
    });
  }

  return (
    <section
      className="relative overflow-hidden rounded-[32px] border border-[#ff7f20]/15 bg-[linear-gradient(135deg,#fff5ed_0%,#ffffff_55%,#f3f7f2_100%)] px-5 py-5 sm:px-6 sm:py-6"
      aria-label={title}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-8 h-28 w-28 rounded-full bg-[#ff7f20]/15 blur-2xl"
      />

      <div className="relative mb-5 flex items-start justify-between gap-4">
        <h2 className="font-display text-lg font-black tracking-tight text-[#3C2F2F] uppercase sm:text-xl">
          {title}
        </h2>
        <p className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-[#3C2F2F] ring-1 ring-[#dedede]">
          {formatItemCount(itemCount, itemsOneLabel, itemsManyLabel)}
        </p>
      </div>

      <motion.ul
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={reduceMotion ? undefined : checkoutTileStagger}
        className="relative flex flex-wrap gap-4"
      >
        {products.map((product) => (
          <motion.li
            key={product.id}
            variants={reduceMotion ? undefined : checkoutTileItem}
            layout
            className="w-24 sm:w-28"
          >
            <div className="relative">
              <div className="relative aspect-square overflow-hidden rounded-[22px] border border-[#dedede] bg-white shadow-[0_8px_24px_rgba(60,47,47,0.06)]">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    sizes="112px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#a1a1aa]">
                    —
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(product.id)}
                disabled={pending}
                className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#3C2F2F] shadow-md ring-1 ring-[#dedede] transition hover:text-[#ff7f20] disabled:opacity-60"
                aria-label={removeItemLabel}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <p
              className="mt-2 truncate text-sm font-medium text-[#3C2F2F]"
              title={product.title}
            >
              {product.title}
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

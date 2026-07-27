"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addToCart } from "@/features/cart/cart";

const ADD_TO_CART_ICON = "/assets/product-card/add-to-cart.svg";

type AddToCartButtonProps = {
  productId: string;
  label: string;
  disabled?: boolean;
  className?: string;
};

export function AddToCartButton({
  productId,
  label,
  disabled = false,
  className = "",
}: AddToCartButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [justAdded, setJustAdded] = useState(false);

  function handleClick(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();
    event.stopPropagation();
    if (disabled || pending) return;

    startTransition(async () => {
      try {
        await addToCart(productId, 1);
        setJustAdded(true);
        router.refresh();
        window.setTimeout(() => setJustAdded(false), 1500);
      } catch {
        setJustAdded(false);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending}
      aria-label={label}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:-translate-y-1.5 active:scale-95 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${justAdded ? "scale-95" : ""} ${className}`}
    >
      <Image
        src={ADD_TO_CART_ICON}
        alt=""
        width={51}
        height={52}
        className="pointer-events-none size-full object-contain"
        aria-hidden
      />
    </button>
  );
}

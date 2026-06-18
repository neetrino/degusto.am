const DEFAULT_CART_CURRENCY = "AMD";

type CartTotalsLike = {
  subtotal?: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total?: number;
  currency?: string;
};

type CartLike<TItem = unknown> = {
  id?: string;
  items?: TItem[];
  totals?: CartTotalsLike;
  itemsCount?: number;
} | null;

export type CartApiStableResponse<TItem = unknown> = {
  items: TItem[];
  total: number;
  currency: string;
  status: "ok";
  cart: {
    id: string;
    items: TItem[];
    totals: {
      subtotal: number;
      discount: number;
      shipping: number;
      tax: number;
      total: number;
      currency: string;
    };
    itemsCount: number;
  };
};

function toFiniteNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deriveCartTotals<TItem>(
  cart: Exclude<CartLike<TItem>, null>
): CartApiStableResponse<TItem>["cart"]["totals"] {
  const totals = cart.totals;
  const totalFromTotals = toFiniteNumber(totals?.total);
  const subtotalFromTotals = toFiniteNumber(totals?.subtotal);
  const total = totalFromTotals || subtotalFromTotals;
  const subtotal = subtotalFromTotals || total;
  const currency = totals?.currency?.trim() || DEFAULT_CART_CURRENCY;

  return {
    subtotal,
    discount: toFiniteNumber(totals?.discount),
    shipping: toFiniteNumber(totals?.shipping),
    tax: toFiniteNumber(totals?.tax),
    total,
    currency,
  };
}

export function toCartApiStableResponse<TItem = unknown>(
  cart: CartLike<TItem>
): CartApiStableResponse<TItem> {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  const totals = cart ? deriveCartTotals(cart) : deriveCartTotals({ items });
  const itemsCount =
    typeof cart?.itemsCount === "number"
      ? cart.itemsCount
      : items.reduce((sum, item) => {
          const quantity = (item as { quantity?: unknown }).quantity;
          const parsed = toFiniteNumber(quantity);
          return parsed > 0 ? sum + parsed : sum;
        }, 0);

  const normalizedCart = {
    id: typeof cart?.id === "string" ? cart.id : "",
    items,
    totals,
    itemsCount,
  };

  return {
    items: normalizedCart.items,
    total: normalizedCart.totals.total,
    currency: normalizedCart.totals.currency,
    status: "ok",
    cart: normalizedCart,
  };
}

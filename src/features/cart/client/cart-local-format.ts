import { formatMoneyAmount } from "@/lib/money/format";
import type { Currency } from "@/lib/money/currency";
import type { Locale } from "@/lib/i18n/config";

import type { CartLocalItem, CartLocalView } from "@/features/cart/client/cart-local-types";

export function formatCartLine(
  unitAmount: number,
  quantity: number,
  currency: Currency,
  locale: Locale,
): { unitPriceFormatted: string; lineTotalFormatted: string } {
  return {
    unitPriceFormatted: formatMoneyAmount(unitAmount, currency, locale),
    lineTotalFormatted: formatMoneyAmount(
      unitAmount * quantity,
      currency,
      locale,
    ),
  };
}

export function withFormattedCartItem(
  item: Omit<CartLocalItem, "unitPriceFormatted" | "lineTotalFormatted"> & {
    unitPriceFormatted?: string;
    lineTotalFormatted?: string;
  },
  currency: Currency,
  locale: Locale,
): CartLocalItem {
  if (item.unitAmount != null) {
    const formatted = formatCartLine(
      item.unitAmount,
      item.quantity,
      currency,
      locale,
    );
    return {
      id: item.id,
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      unitAmount: item.unitAmount,
      ...formatted,
    };
  }

  const unitPriceFormatted = item.unitPriceFormatted ?? "—";
  return {
    id: item.id,
    productId: item.productId,
    title: item.title,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    unitAmount: null,
    unitPriceFormatted,
    lineTotalFormatted: item.lineTotalFormatted ?? unitPriceFormatted,
  };
}

export function recomputeCartLocalView(
  items: CartLocalItem[],
  locale: Locale,
  currency: Currency,
  shippingFormatted: string,
): CartLocalView {
  const normalized = items
    .filter((item) => item.quantity > 0)
    .map((item) => withFormattedCartItem(item, currency, locale));
  const itemCount = normalized.reduce((sum, item) => sum + item.quantity, 0);
  const allPriced = normalized.every((item) => item.unitAmount != null);

  let subtotalFormatted = "—";
  let totalFormatted = "—";
  if (allPriced && normalized.length > 0) {
    const subtotal = normalized.reduce(
      (sum, item) => sum + (item.unitAmount ?? 0) * item.quantity,
      0,
    );
    subtotalFormatted = formatMoneyAmount(subtotal, currency, locale);
    totalFormatted = subtotalFormatted;
  } else if (normalized.length === 0) {
    subtotalFormatted = formatMoneyAmount(0, currency, locale);
    totalFormatted = subtotalFormatted;
  }

  return {
    locale,
    currency,
    itemCount,
    items: normalized,
    subtotalFormatted,
    shippingFormatted,
    totalFormatted,
    updatedAt: Date.now(),
  };
}

export function emptyCartShipping(locale: Locale, currency: Currency): string {
  return formatMoneyAmount(0, currency, locale);
}

export function localCartItemId(productId: string): string {
  return `local:${productId}`;
}

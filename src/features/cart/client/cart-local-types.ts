import type { CartDrawerView } from "@/features/cart/get-cart-drawer-view";
import type { Currency } from "@/lib/money/currency";
import type { Locale } from "@/lib/i18n/config";

export type CartLocalItem = {
  id: string;
  productId: string;
  title: string;
  quantity: number;
  imageUrl: string | null;
  /** Display-currency minor units; null when only a formatted label is known. */
  unitAmount: number | null;
  unitPriceFormatted: string;
  lineTotalFormatted: string;
};

export type CartLocalView = {
  locale: Locale;
  currency: Currency;
  itemCount: number;
  items: CartLocalItem[];
  subtotalFormatted: string;
  shippingFormatted: string;
  totalFormatted: string;
  updatedAt: number;
};

export type CartProductSnapshot = {
  productId: string;
  title: string;
  imageUrl: string | null;
  unitPriceFormatted: string;
  unitAmount?: number | null;
};

/** Maps local cache into drawer view shape. */
export function toCartDrawerView(view: CartLocalView): CartDrawerView {
  return {
    itemCount: view.itemCount,
    items: view.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      title: item.title,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      unitAmount: item.unitAmount,
      unitPriceFormatted: item.unitPriceFormatted,
      lineTotalFormatted: item.lineTotalFormatted,
    })),
    subtotalFormatted: view.subtotalFormatted,
    shippingFormatted: view.shippingFormatted,
    totalFormatted: view.totalFormatted,
  };
}

import { notFound } from "next/navigation";

import { getCartDrawerView } from "@/features/cart/get-cart-drawer-view";
import { CartPanel } from "@/features/cart/ui/CartPanel";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getSelectedCurrency } from "@/lib/money/display-price";

type CartPageProps = { params: Promise<{ locale: string }> };

function toStorefrontPrice(formatted: string): string {
  return formatted.replace(/\sAMD\b/g, " Դ");
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const currency = await getSelectedCurrency();
  const view = await getCartDrawerView(rawLocale, currency);

  const displayView = {
    ...view,
    items: view.items.map((item) => ({
      ...item,
      unitPriceFormatted: toStorefrontPrice(item.unitPriceFormatted),
      lineTotalFormatted: toStorefrontPrice(item.lineTotalFormatted),
    })),
    subtotalFormatted: toStorefrontPrice(view.subtotalFormatted),
    shippingFormatted: toStorefrontPrice(view.shippingFormatted),
    totalFormatted: toStorefrontPrice(view.totalFormatted),
  };

  return (
    <CartPanel
      locale={rawLocale}
      view={displayView}
      labels={dictionary.cartDrawer}
      shopHref={`/${rawLocale}/products?category=all`}
    />
  );
}

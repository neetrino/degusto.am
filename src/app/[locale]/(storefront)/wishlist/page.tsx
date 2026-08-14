import { notFound } from "next/navigation";

import { StorefrontMobileChrome } from "@/components/layout/StorefrontMobileChrome";
import {
  getPrimaryCategoryLabels,
} from "@/features/products/queries";
import { listWishlistProducts } from "@/features/wishlist/queries";
import { WishlistPanel } from "@/features/wishlist/ui/WishlistPanel";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  createDisplayPriceFormatter,
  getSelectedCurrency,
} from "@/lib/money/display-price";
import { formatStorefrontPrice } from "@/lib/money/format";

type WishlistPageProps = {
  params: Promise<{ locale: string }>;
};

const WISHLIST_CARD_RATING = 5;

function firstPhoneHref(phones: string): string {
  const match = phones.match(/\d[\d\s()-]{5,}/);
  if (!match) {
    return "tel:+37460388080";
  }
  const digits = match[0].replace(/\D/g, "");
  return `tel:+${digits.startsWith("0") ? `374${digits.slice(1)}` : digits}`;
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const wishlistCopy = dictionary.wishlist;
  const [user, currency, products] = await Promise.all([
    getCurrentUser(),
    getSelectedCurrency(),
    listWishlistProducts(rawLocale),
  ]);

  const isSignedIn = Boolean(user);
  const formatPrice = await createDisplayPriceFormatter(rawLocale, currency);
  const categoryLabels = isSignedIn
    ? await getPrimaryCategoryLabels(
        products.map((product) => product.id),
        rawLocale,
      )
    : new Map<string, string>();

  const cards = isSignedIn
    ? products.map((product) => {
        const price = formatPrice(product.priceAmount);
        const compareAt =
          product.compareAtAmount != null
            ? formatPrice(product.compareAtAmount)
            : null;

        return {
          id: product.id,
          href: `/${rawLocale}/products/${product.translation.slug}`,
          title: product.translation.title,
          priceFormatted: formatStorefrontPrice(price),
          compareAtFormatted: compareAt ? formatStorefrontPrice(compareAt) : null,
          discountPercent: product.discountPercent,
          imageUrl: product.imageUrl,
          inStock: product.stockOnHand > 0,
          categoryLabel: categoryLabels.get(product.id) ?? null,
        };
      })
    : [];

  const panelProps = {
    locale: rawLocale,
    title: wishlistCopy.title,
    emptyTitle: wishlistCopy.emptyTitle,
    emptyDescription: wishlistCopy.emptyDescription,
    loginLabel: isSignedIn ? undefined : dictionary.header.login,
    loginHref: isSignedIn
      ? undefined
      : `/${rawLocale}/login?next=${encodeURIComponent(`/${rawLocale}/wishlist`)}`,
    viewProductsLabel: wishlistCopy.viewProducts,
    viewProductsHref: `/${rawLocale}/products?category=all`,
    products: cards,
    wishlistLabel: dictionary.nav.wishlist,
    addToCartLabel: dictionary.product.addToCart,
    outOfStockLabel: dictionary.product.outOfStock,
    isSignedIn,
    rating: WISHLIST_CARD_RATING,
  };

  return (
    <div
      data-wishlist-page
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white"
    >
      <StorefrontMobileChrome
        locale={rawLocale}
        currency={currency}
        brand={dictionary.brand}
        callLabel={dictionary.home.call}
        phoneHref={firstPhoneHref(dictionary.footer.phones)}
        currencyLabel={dictionary.header.currency}
        languageLabel={dictionary.header.language}
        searchLabel={dictionary.header.search}
        searchPlaceholder={dictionary.header.search}
      >
        <WishlistPanel {...panelProps} />
      </StorefrontMobileChrome>

      <div className="mx-auto hidden w-full max-w-[min(1450px,calc(100%-2rem))] px-4 py-6 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:block lg:max-w-[min(1450px,calc(100%-3rem))]">
        <WishlistPanel {...panelProps} />
      </div>
    </div>
  );
}

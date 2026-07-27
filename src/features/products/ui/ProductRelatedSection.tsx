import { ProductRelatedCarousel } from "@/features/products/ui/ProductRelatedCarousel";
import {
  getPrimaryCategoryLabels,
  getRelatedProducts,
} from "@/features/products/queries";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { createDisplayPriceFormatter } from "@/lib/money/display-price";
import type { Currency } from "@/lib/money/currency";

type ProductRelatedSectionProps = {
  locale: Locale;
  productId: string;
  currency: Currency;
  isSignedIn: boolean;
  dictionary: Dictionary;
};

/** Streams below the PDP fold — does not block gallery/purchase chrome. */
export async function ProductRelatedSection({
  locale,
  productId,
  currency,
  isSignedIn,
  dictionary,
}: ProductRelatedSectionProps) {
  const related = await getRelatedProducts(locale, productId);
  if (related.length === 0) {
    return null;
  }

  const [wishlistIds, formatPrice, categoryLabels] = await Promise.all([
    getWishlistProductIds(related.map((item) => item.id)),
    createDisplayPriceFormatter(locale, currency),
    getPrimaryCategoryLabels(
      related.map((item) => item.id),
      locale,
    ),
  ]);

  const labels = dictionary.product;

  const cards = related.map((item) => {
    const price = formatPrice(item.priceAmount);
    const compareAt =
      item.compareAtAmount != null
        ? formatPrice(item.compareAtAmount)
        : null;

    return {
      id: item.id,
      href: `/${locale}/products/${item.translation.slug}`,
      title: item.translation.title,
      priceFormatted: price.formatted,
      compareAtFormatted: compareAt?.formatted ?? null,
      discountPercent: item.discountPercent,
      imageUrl: item.imageUrl,
      inStock: item.stockOnHand > 0,
      inWishlist: wishlistIds.has(item.id),
      categoryLabel: categoryLabels.get(item.id) ?? null,
    };
  });

  return (
    <ProductRelatedCarousel
      locale={locale}
      title={labels.tryAlso}
      viewMoreLabel={labels.viewMore}
      viewMoreHref={`/${locale}/products`}
      isSignedIn={isSignedIn}
      wishlistLabel={dictionary.nav.wishlist}
      addToCartLabel={labels.addToCart}
      outOfStockLabel={labels.outOfStock}
      cards={cards}
    />
  );
}

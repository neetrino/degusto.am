import "server-only";

import {
  getActiveProductsPage,
  getPrimaryCategoryLabels,
} from "@/features/products/queries";
import type { Locale } from "@/lib/i18n/config";
import {
  createDisplayPriceFormatter,
  getSelectedCurrency,
} from "@/lib/money/display-price";
import { formatStorefrontPrice } from "@/lib/money/format";

const SEARCH_SUGGESTIONS_LIMIT = 8;

export type CatalogSearchSuggestion = {
  id: string;
  href: string;
  title: string;
  categoryLabel: string | null;
  priceFormatted: string;
  compareAtFormatted: string | null;
  imageUrl: string | null;
};

/** Live header/catalog search suggestions for a query string. */
export async function searchCatalogSuggestions(
  locale: Locale,
  query: string,
): Promise<CatalogSearchSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const currency = await getSelectedCurrency();
  const { products } = await getActiveProductsPage(locale, 1, {
    query: trimmed,
  });
  const limited = products.slice(0, SEARCH_SUGGESTIONS_LIMIT);
  const [formatPrice, categoryLabels] = await Promise.all([
    createDisplayPriceFormatter(locale, currency),
    getPrimaryCategoryLabels(
      limited.map((product) => product.id),
      locale,
    ),
  ]);

  return limited.map((product) => {
    const price = formatPrice(product.priceAmount);
    const compareAt =
      product.compareAtAmount != null
        ? formatPrice(product.compareAtAmount)
        : null;

    return {
      id: product.id,
      href: `/${locale}/products/${product.translation.slug}`,
      title: product.translation.title,
      categoryLabel: categoryLabels.get(product.id) ?? null,
      priceFormatted: formatStorefrontPrice(price),
      compareAtFormatted: compareAt ? formatStorefrontPrice(compareAt) : null,
      imageUrl: product.imageUrl,
    };
  });
}

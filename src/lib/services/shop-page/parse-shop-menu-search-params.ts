import { normalizeStorefrontCategorySlug } from '@/constants/storefront-all-category-slug';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { resolveStorefrontLocaleFromSearchParams } from '@/lib/i18n/locale';
import type { ShopMenuQuery } from './shop-page-query.types';

export type ParsedShopMenuSearchParams = {
  locale: StorefrontLocale;
  selectedCategorySlug: string;
  rawCategorySlug: string;
  selectedSearchQuery: string;
  tasteFilter: 'leaf' | 'pepper' | null;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
  requestedPage: number;
};

function parseOptionalPrice(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Parses `/shop` (and combo) menu query params from URLSearchParams. */
export function parseShopMenuSearchParams(
  searchParams: URLSearchParams,
  localeOverride?: StorefrontLocale
): ParsedShopMenuSearchParams {
  const locale = localeOverride ?? resolveStorefrontLocaleFromSearchParams(searchParams);
  const rawCategorySlug =
    typeof searchParams.get('category') === 'string'
      ? searchParams.get('category')!.trim()
      : '';
  const selectedCategorySlug = normalizeStorefrontCategorySlug(rawCategorySlug);
  const selectedSearchQuery =
    typeof searchParams.get('search') === 'string' ? searchParams.get('search')!.trim() : '';
  const tasteParam = searchParams.get('taste');
  const tasteFilter =
    tasteParam === 'leaf' || tasteParam === 'pepper' ? tasteParam : null;
  const rawPage = typeof searchParams.get('page') === 'string' ? searchParams.get('page')!.trim() : '';
  const parsedPage = parseInt(rawPage || '1', 10);
  const requestedPage =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  return {
    locale,
    rawCategorySlug,
    selectedCategorySlug,
    selectedSearchQuery,
    tasteFilter,
    minPriceAmd: parseOptionalPrice(searchParams.get('minPrice')),
    maxPriceAmd: parseOptionalPrice(searchParams.get('maxPrice')),
    requestedPage,
  };
}

export function toShopMenuProductsQuery(
  parsed: ParsedShopMenuSearchParams
): Pick<
  ShopMenuQuery,
  | 'locale'
  | 'selectedCategorySlug'
  | 'selectedSearchQuery'
  | 'tasteFilter'
  | 'minPriceAmd'
  | 'maxPriceAmd'
  | 'requestedPage'
> {
  return {
    locale: parsed.locale,
    selectedCategorySlug: parsed.selectedCategorySlug,
    selectedSearchQuery: parsed.selectedSearchQuery,
    tasteFilter: parsed.tasteFilter,
    minPriceAmd: parsed.minPriceAmd,
    maxPriceAmd: parsed.maxPriceAmd,
    requestedPage: parsed.requestedPage,
  };
}

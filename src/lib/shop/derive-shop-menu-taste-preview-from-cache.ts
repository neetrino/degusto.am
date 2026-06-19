import type { MenuCard } from '@/components/home/menu-types';
import { normalizeStorefrontCategorySlug } from '@/constants/storefront-all-category-slug';
import { forEachValidShopMenuProductsCacheEntry } from './shop-menu-products-cache';

type TasteFilter = 'leaf' | 'pepper';

type MenuBaseContext = {
  categorySlug: string;
  searchQuery: string;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
};

function parseOptionalPrice(value: string | null): number | null {
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function hrefOrApiUrlToSearchParams(hrefOrUrl: string): URLSearchParams {
  const questionIndex = hrefOrUrl.indexOf('?');
  const search =
    questionIndex >= 0
      ? hrefOrUrl.slice(questionIndex + 1)
      : hrefOrUrl.startsWith('?')
        ? hrefOrUrl.slice(1)
        : '';
  return new URLSearchParams(search);
}

function parseMenuBaseContext(params: URLSearchParams): MenuBaseContext & { tasteFilter: TasteFilter | null } {
  const tasteParam = params.get('taste');
  const tasteFilter = tasteParam === 'leaf' || tasteParam === 'pepper' ? tasteParam : null;
  const rawCategory = params.get('category')?.trim() ?? '';

  return {
    categorySlug: normalizeStorefrontCategorySlug(rawCategory),
    searchQuery: params.get('search')?.trim() ?? '',
    minPriceAmd: parseOptionalPrice(params.get('minPrice')),
    maxPriceAmd: parseOptionalPrice(params.get('maxPrice')),
    tasteFilter,
  };
}

function baseContextsMatch(source: MenuBaseContext, target: MenuBaseContext): boolean {
  return (
    source.categorySlug === target.categorySlug &&
    source.searchQuery === target.searchQuery &&
    source.minPriceAmd === target.minPriceAmd &&
    source.maxPriceAmd === target.maxPriceAmd
  );
}

function cacheEntryIsNeutralTasteSource(params: URLSearchParams): boolean {
  const taste = params.get('taste');
  return taste !== 'leaf' && taste !== 'pepper';
}

function cardMatchesTaste(card: MenuCard, taste: TasteFilter): boolean {
  return taste === 'pepper' ? card.supportsSpicy === true : card.supportsGreens === true;
}

function cardMatchesPrice(
  card: MenuCard,
  minPriceAmd: number | null,
  maxPriceAmd: number | null
): boolean {
  if (minPriceAmd !== null && card.price < minPriceAmd) {
    return false;
  }
  if (maxPriceAmd !== null && card.price > maxPriceAmd) {
    return false;
  }
  return true;
}

function cardMatchesSearch(card: MenuCard, searchQuery: string): boolean {
  if (!searchQuery) {
    return true;
  }
  const haystack = (card.title ?? card.slug ?? '').toLowerCase();
  return haystack.includes(searchQuery.toLowerCase());
}

function cardMatchesPreviewFilters(
  card: MenuCard,
  taste: TasteFilter,
  context: MenuBaseContext
): boolean {
  return (
    cardMatchesTaste(card, taste) &&
    cardMatchesPrice(card, context.minPriceAmd, context.maxPriceAmd) &&
    cardMatchesSearch(card, context.searchQuery)
  );
}

function collectPreviewCards(
  cards: MenuCard[],
  taste: TasteFilter,
  context: MenuBaseContext,
  seen: Set<string>,
  preview: MenuCard[]
): void {
  for (const card of cards) {
    if (seen.has(card.id)) {
      continue;
    }
    if (!cardMatchesPreviewFilters(card, taste, context)) {
      continue;
    }
    seen.add(card.id);
    preview.push(card);
  }
}

/** Returns true when href applies a hot or veggie taste filter. */
export function hrefHasTasteFilter(href: string): boolean {
  const tasteParam = hrefOrApiUrlToSearchParams(href).get('taste');
  return tasteParam === 'leaf' || tasteParam === 'pepper';
}

/**
 * Derives instant taste-filter preview cards from client cache (same category/search/price, neutral taste).
 * Used before authoritative menu-products API response arrives.
 */
export function deriveShopMenuTastePreviewFromCache(
  href: string,
  fallbackCards: MenuCard[] = []
): MenuCard[] {
  const targetContext = parseMenuBaseContext(hrefOrApiUrlToSearchParams(href));
  const taste = targetContext.tasteFilter;
  if (!taste) {
    return [];
  }

  const contextWithoutTaste: MenuBaseContext = {
    categorySlug: targetContext.categorySlug,
    searchQuery: targetContext.searchQuery,
    minPriceAmd: targetContext.minPriceAmd,
    maxPriceAmd: targetContext.maxPriceAmd,
  };

  const seen = new Set<string>();
  const preview: MenuCard[] = [];

  forEachValidShopMenuProductsCacheEntry((url, data) => {
    const entryParams = hrefOrApiUrlToSearchParams(url);
    if (!cacheEntryIsNeutralTasteSource(entryParams)) {
      return;
    }
    const entryContext = parseMenuBaseContext(entryParams);
    if (!baseContextsMatch(entryContext, contextWithoutTaste)) {
      return;
    }
    collectPreviewCards(data.cards, taste, contextWithoutTaste, seen, preview);
  });

  collectPreviewCards(fallbackCards, taste, contextWithoutTaste, seen, preview);
  return preview;
}

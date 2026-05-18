export type ShopMenuQueryState = {
  categorySlug: string;
  searchQuery: string;
  tasteFilter: 'leaf' | 'pepper' | null;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
  openFilters: boolean;
};

/** Mobile Figma category grid on `/shop` (bottom nav Shop). Product list when any filter is active. */
export function shouldShowMobileShopCategoryGrid(query: ShopMenuQueryState): boolean {
  if (query.openFilters) {
    return false;
  }
  if (query.categorySlug.trim() !== '') {
    return false;
  }
  if (query.searchQuery.trim() !== '') {
    return false;
  }
  if (query.tasteFilter !== null) {
    return false;
  }
  if (query.minPriceAmd !== null || query.maxPriceAmd !== null) {
    return false;
  }
  return true;
}

export function resolveShopMenuQueryState(params: URLSearchParams): ShopMenuQueryState {
  const parseAmd = (key: string): number | null => {
    const raw = params.get(key);
    if (!raw) {
      return null;
    }
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };

  const taste = params.get('taste');
  const tasteFilter = taste === 'leaf' || taste === 'pepper' ? taste : null;

  return {
    categorySlug: params.get('category')?.trim() ?? '',
    searchQuery: params.get('search')?.trim() ?? '',
    tasteFilter,
    minPriceAmd: parseAmd('minPrice'),
    maxPriceAmd: parseAmd('maxPrice'),
    openFilters: params.get('openFilters') === '1',
  };
}

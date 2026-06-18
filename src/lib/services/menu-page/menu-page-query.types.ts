import type { StorefrontLocale } from '@/lib/i18n/locale';

export type MenuPageFilterQuery = {
  locale: StorefrontLocale;
  selectedSearchQuery: string;
  tasteFilter: 'leaf' | 'pepper' | null;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
};

/** Shop excludes combo category; combo page includes only combo products. */
export type MenuPageComboScope = 'exclude' | 'only';

export type MenuCategoryProductCounts = {
  allProductCount: number;
  countBySlug: Record<string, number>;
};

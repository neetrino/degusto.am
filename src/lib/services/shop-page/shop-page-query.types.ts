import type { MenuCard, MenuCategory } from '@/components/home/menu-types';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { ShopMenuProductRow } from './shop-page-data.helpers';

export type ShopMenuQuery = {
  locale: StorefrontLocale;
  selectedCategorySlug: string;
  selectedSearchQuery: string;
  tasteFilter: 'leaf' | 'pepper' | null;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
  requestedPage: number;
  /** Mobile `/shop` category grid only — skips product list queries. */
  mobileCategoryGridOnly: boolean;
};

export type ShopMobileCategoryCard = {
  id: string;
  slug: string;
  title: string;
  iconUrl: string | null;
  productCount?: number;
};

export type ShopMenuData = {
  cards: MenuCard[];
  categories: MenuCategory[];
  mobileShopCategories: ShopMobileCategoryCard[];
  effectivePage: number;
  totalPages: number;
};

export type ShopMenuDbResult = {
  productTotal: number;
  productRows: ShopMenuProductRow[];
  categoryRows: Array<{
    id: string;
    media: unknown;
    translations: Array<{
      locale: string;
      title: string;
      slug: string;
    }>;
  }>;
  allProductCount: number;
  countBySlug: Record<string, number>;
};

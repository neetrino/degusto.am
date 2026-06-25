import type { MenuCard, MenuCategory } from '@/components/home/menu-types';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { ShopMenuProductRow } from '../shop-page/shop-page-data.helpers';

export type ComboMenuQuery = {
  locale: StorefrontLocale;
  selectedCategorySlug: string;
  selectedSearchQuery: string;
  tasteFilter: 'leaf' | 'pepper' | null;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
  requestedPage: number;
};

export type ComboMenuData = {
  cards: MenuCard[];
  categories: MenuCategory[];
  effectivePage: number;
  totalPages: number;
};

export type ComboMenuDbResult = {
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

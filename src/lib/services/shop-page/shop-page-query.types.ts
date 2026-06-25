import type { MenuCard, MenuCategory } from '@/components/home/menu-types';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { ShopMenuProductRow } from './shop-page-data.helpers';

export type ShopMenuLoadProfile = 'full' | 'mobile-grid' | 'products-only';

export type ShopMenuQuery = {
  locale: StorefrontLocale;
  selectedCategorySlug: string;
  selectedSearchQuery: string;
  tasteFilter: 'leaf' | 'pepper' | null;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
  requestedPage: number;
  /** Controls which DB payloads are loaded for the current viewport/mode. */
  loadProfile: ShopMenuLoadProfile;
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
  /** Mobile product list: categories skipped server-side; button still shown when true. */
  showCategoryPicker: boolean;
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

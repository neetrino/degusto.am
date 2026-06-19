import type { MenuCard, MenuCategory } from '@/components/home/menu-types';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { ShopMenuProductRow } from '../shop-page/shop-page-data.helpers';

export type ComboMenuLoadProfile = 'full' | 'products-only';

export type ComboMenuQuery = {
  locale: StorefrontLocale;
  selectedCategorySlug: string;
  selectedSearchQuery: string;
  tasteFilter: 'leaf' | 'pepper' | null;
  minPriceAmd: number | null;
  maxPriceAmd: number | null;
  requestedPage: number;
  loadProfile: ComboMenuLoadProfile;
  /** Lighter product query for first combo page paint. */
  menuFast?: boolean;
};

export type ComboMenuData = {
  cards: MenuCard[];
  categories: MenuCategory[];
  showCategoryPicker: boolean;
  effectivePage: number;
  totalPages: number;
};

export type ComboMenuProductsPage = Pick<ComboMenuData, 'cards' | 'effectivePage' | 'totalPages'>;

export type ComboMenuSidebarPayload = Pick<ComboMenuData, 'categories' | 'showCategoryPicker'>;

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

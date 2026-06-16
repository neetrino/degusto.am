'use client';

import { FigmaDesktopMenuPage } from './FigmaDesktopShopPage';
import type { MenuCard, MenuCategory } from './FigmaDesktopShopPage';

const COMBO_CATEGORY_INDEX = 12;

interface FigmaDesktopComboPageProps {
  cards?: MenuCard[];
  categories?: MenuCategory[];
  activeCategorySlug?: string;
  initialSearch?: string;
  initialMinPrice?: string;
  initialMaxPrice?: string;
  initialFoodFilter?: 'leaf' | 'neutral' | 'pepper';
  menuPagination?: {
    currentPage: number;
    totalPages: number;
  };
  showMobileProductsList?: boolean;
  renderDesktopLayout?: boolean;
}

export function FigmaDesktopComboPage({
  cards,
  categories,
  activeCategorySlug = '',
  initialSearch = '',
  initialMinPrice = '',
  initialMaxPrice = '',
  initialFoodFilter = 'neutral',
  menuPagination,
  showMobileProductsList = true,
  renderDesktopLayout = true,
}: FigmaDesktopComboPageProps) {
  return (
    <FigmaDesktopMenuPage
      titleKey="common.navigation.combo"
      subtitleKey="home.figma.desktop.combo.subtitle"
      activeCategoryIndex={COMBO_CATEGORY_INDEX}
      cards={cards}
      categories={categories}
      activeCategorySlug={activeCategorySlug}
      initialSearch={initialSearch}
      initialMinPrice={initialMinPrice}
      initialMaxPrice={initialMaxPrice}
      initialFoodFilter={initialFoodFilter}
      menuPagination={menuPagination}
      showMobileProductsList={showMobileProductsList}
      renderDesktopLayout={renderDesktopLayout}
    />
  );
}

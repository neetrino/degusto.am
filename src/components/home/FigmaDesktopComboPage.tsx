'use client';

import { FigmaDesktopMenuPage } from './FigmaDesktopShopPage';
import type { MenuCard, MenuCategory } from './FigmaDesktopShopPage';

const COMBO_CATEGORY_INDEX = 12;

interface FigmaDesktopComboPageProps {
  cards?: MenuCard[];
  categories?: MenuCategory[];
  activeCategorySlug?: string;
}

export function FigmaDesktopComboPage({
  cards,
  categories,
  activeCategorySlug = '',
}: FigmaDesktopComboPageProps) {
  return (
    <FigmaDesktopMenuPage
      titleKey="common.navigation.combo"
      subtitleKey="home.figma.desktop.combo.subtitle"
      activeCategoryIndex={COMBO_CATEGORY_INDEX}
      cards={cards}
      categories={categories}
      activeCategorySlug={activeCategorySlug}
    />
  );
}

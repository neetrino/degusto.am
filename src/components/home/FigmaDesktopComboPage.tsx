'use client';

import { FigmaDesktopMenuPage } from './FigmaDesktopShopPage';

const COMBO_CATEGORY_INDEX = 12;

export function FigmaDesktopComboPage() {
  return (
    <FigmaDesktopMenuPage
      titleKey="common.navigation.combo"
      subtitleKey="home.figma.desktop.combo.subtitle"
      activeCategoryIndex={COMBO_CATEGORY_INDEX}
    />
  );
}

'use client';

import { useTranslation } from '@/lib/i18n-client';
import {
  FOOD_TASTE_GREENS_ICON_SRC,
  FOOD_TASTE_HOT_ICON_SRC,
} from '@/lib/product-food-taste-icons';
import { HomeProductFoodAttributeBadges } from '@/components/home/HomeProductFoodAttributeBadges';
import type { FoodTasteBadgeSelection } from '@/lib/product-food-taste-admin';

interface ProductFoodTasteBadgesSectionProps {
  selection: FoodTasteBadgeSelection;
  onSelectionChange: (next: FoodTasteBadgeSelection) => void;
}

type TasteToggleKey = keyof FoodTasteBadgeSelection;

const TOGGLE_CONFIG: Array<{
  key: keyof FoodTasteBadgeSelection;
  iconSrc: string;
  labelKey: 'foodTasteBadgesSpicy' | 'foodTasteBadgesGreens';
  selectedRingClass: string;
  iconWrapperClass: string;
  iconClass: string;
}> = [
  {
    key: 'supportsSpicy',
    iconSrc: FOOD_TASTE_HOT_ICON_SRC,
    labelKey: 'foodTasteBadgesSpicy',
    selectedRingClass: 'ring-2 ring-[#ff2b2e] border-[#ff2b2e]',
    iconWrapperClass: 'bg-[#ff2b2e]',
    iconClass: 'h-[19px] w-[19px] -rotate-[13deg] object-contain',
  },
  {
    key: 'supportsGreens',
    iconSrc: FOOD_TASTE_GREENS_ICON_SRC,
    labelKey: 'foodTasteBadgesGreens',
    selectedRingClass: 'ring-2 ring-emerald-500 border-emerald-500',
    iconWrapperClass: 'overflow-hidden',
    iconClass: 'h-8 w-8 scale-110 object-cover',
  },
];

export function ProductFoodTasteBadgesSection({
  selection,
  onSelectionChange,
}: ProductFoodTasteBadgesSectionProps) {
  const { t } = useTranslation();

  const handleToggle = (key: TasteToggleKey) => {
    onSelectionChange({
      ...selection,
      [key]: !selection[key],
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {t('admin.products.add.foodTasteBadgesTitle')}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        {t('admin.products.add.foodTasteBadgesDescription')}
      </p>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap gap-4">
        {TOGGLE_CONFIG.map((item) => {
          const isSelected = selection[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleToggle(item.key)}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isSelected
                  ? `${item.selectedRingClass} bg-white`
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${item.iconWrapperClass}`}
              >
                <img
                  src={item.iconSrc}
                  alt=""
                  className={item.iconClass}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="text-sm font-medium text-gray-900">
                {t(`admin.products.add.${item.labelKey}`)}
              </span>
            </button>
          );
        })}
        </div>

        {(selection.supportsSpicy || selection.supportsGreens) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-3">
              {t('admin.products.add.foodTasteBadgesPreview')}
            </p>
            <div className="relative h-28 w-40 rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-gray-200" />
              <HomeProductFoodAttributeBadges
                supportsSpicy={selection.supportsSpicy}
                supportsGreens={selection.supportsGreens}
                hotIconSrc={FOOD_TASTE_HOT_ICON_SRC}
                greensIconSrc={FOOD_TASTE_GREENS_ICON_SRC}
                variant="desktop-card"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

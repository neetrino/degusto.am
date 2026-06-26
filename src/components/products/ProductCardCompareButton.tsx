'use client';

import type { MouseEvent } from 'react';
import { CompareIcon } from '../icons/CompareIcon';
import { useCompare } from '../hooks/useCompare';
import { useTranslation } from '@/lib/i18n-client';
import {
  PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS,
  getProductCardCompareHoverClasses,
} from '@/constants/product-card-action-hover';

type ProductCardCompareButtonProps = {
  productId: string;
  className?: string;
  iconSize?: number;
};

/** Floating compare toggle on storefront product cards (home/shop). */
export function ProductCardCompareButton({
  productId,
  className = 'absolute left-2 top-2 z-20',
  iconSize = 16,
}: ProductCardCompareButtonProps) {
  const { t } = useTranslation();
  const { isInCompare, toggleCompare } = useCompare(productId);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void toggleCompare();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${className} flex h-8 w-8 items-center justify-center rounded-full border shadow-md sm:h-9 sm:w-9 ${PRODUCT_CARD_ICON_BTN_INTERACTION_CLASS} ${getProductCardCompareHoverClasses(isInCompare)} ${
        isInCompare
          ? 'border-[#ff7f20] bg-[#ff7f20] text-white'
          : 'border-[#dedede]/90 bg-white/95 text-gray-700'
      }`}
      title={
        isInCompare ? t('common.messages.removedFromCompare') : t('common.messages.addedToCompare')
      }
      aria-label={
        isInCompare ? t('common.ariaLabels.removeFromCompare') : t('common.ariaLabels.addToCompare')
      }
    >
      <CompareIcon size={iconSize} isActive={isInCompare} />
    </button>
  );
}

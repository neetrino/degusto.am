'use client';

import { processImageUrl } from '../../../lib/utils/image-utils';
import { getAttributeLabel } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { logger } from '@/lib/utils/logger';
import type { AttributeGroupValue, ProductVariant } from './types';
import { getOptionValue as getVariantOptionValue } from './utils/variant-helpers';

export interface PdpAttributePillRowProps {
  attrKey: string;
  title: string;
  attrGroups: AttributeGroupValue[];
  language: LanguageCode;
  selectedAttributeValues: Map<string, string>;
  currentVariant: ProductVariant | null;
  unavailableAttributes: Map<string, boolean>;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
}

export function PdpAttributePillRow({
  attrKey,
  title,
  attrGroups,
  language,
  selectedAttributeValues,
  currentVariant,
  unavailableAttributes,
  onAttributeValueSelect,
}: PdpAttributePillRowProps) {
  if (attrGroups.length === 0) return null;
  const isUnavailable = unavailableAttributes.get(attrKey) || false;
  const totalValues = attrGroups.length;
  const paddingClass =
    totalValues > 6 ? 'px-2 py-1' : totalValues > 3 ? 'px-2.5 py-1.5' : 'px-3 py-2';
  const textSizeClass = totalValues > 6 ? 'text-xs' : 'text-sm';
  const imageSizeClass = totalValues > 6 ? 'w-4 h-4' : 'w-5 h-5';
  const minWidthClass = totalValues > 6 ? 'min-w-[40px]' : 'min-w-[50px]';

  return (
    <div className="flex w-full flex-col gap-2.5">
      <label
        className={`text-sm font-semibold tracking-tight ${isUnavailable ? 'text-red-600' : 'text-neutral-900'}`}
      >
        {title}:
      </label>
      <div className="flex flex-wrap gap-2">
        {attrGroups.map((g) => {
          const displayStock = g.stock;
          const selectedRaw = selectedAttributeValues.get(attrKey);
          const variantVal = getVariantOptionValue(currentVariant?.options, attrKey);
          const resolved =
            selectedRaw !== undefined && selectedRaw !== '' ? selectedRaw : variantVal ?? '';
          const isSelected = g.valueId
            ? resolved === g.valueId
            : resolved !== '' &&
              resolved.toLowerCase().trim() === g.value?.toLowerCase().trim();
          const processedImageUrl = g.imageUrl ? processImageUrl(g.imageUrl) : null;
          const hasImage = processedImageUrl && processedImageUrl.trim() !== '';
          const selectPayload = g.valueId && g.valueId.trim() !== '' ? g.valueId : g.value;
          return (
            <button
              type="button"
              key={g.valueId || g.value}
              onClick={() => onAttributeValueSelect(attrKey, selectPayload)}
              className={`${minWidthClass} ${paddingClass} flex items-center gap-1.5 rounded-xl border bg-white shadow-sm transition-all duration-200 ${
                isSelected
                  ? 'border-[#F66812] bg-orange-50/90 ring-1 ring-[#F66812]/25'
                  : displayStock <= 0
                    ? 'border-neutral-200/80 opacity-55 hover:opacity-80'
                    : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md active:scale-[0.98]'
              }`}
            >
              {hasImage && processedImageUrl && (
                <img
                  src={processedImageUrl}
                  alt={g.label}
                  className={`${imageSizeClass} shrink-0 rounded-md border border-neutral-200 object-cover`}
                  onError={(e) => {
                    logger.warn('[PDP ATTR PILL] Image failed to load', {
                      attrKey,
                      url: processedImageUrl,
                    });
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex flex-col text-center">
                <span className={`${textSizeClass} font-medium text-neutral-900`}>
                  {getAttributeLabel(language, attrKey, g.value)}
                </span>
                <span
                  className={`${totalValues > 10 ? 'text-[10px]' : 'text-xs'} tabular-nums ${displayStock > 0 ? 'text-neutral-500' : 'text-neutral-400'}`}
                >
                  ({displayStock})
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

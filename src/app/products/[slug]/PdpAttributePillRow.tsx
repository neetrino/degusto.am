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
    <div className="flex w-full flex-col gap-2">
      <label
        className={`text-xs font-bold uppercase ${isUnavailable ? 'text-red-600' : 'text-neutral-700'}`}
      >
        {title}:
      </label>
      <div className="flex flex-wrap gap-1.5">
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
              className={`${minWidthClass} ${paddingClass} flex items-center gap-1.5 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-green-500 bg-gray-50'
                  : displayStock <= 0
                    ? 'border-gray-200 opacity-60 hover:opacity-80'
                    : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {hasImage && processedImageUrl && (
                <img
                  src={processedImageUrl}
                  alt={g.label}
                  className={`${imageSizeClass} flex-shrink-0 rounded border border-gray-300 object-cover`}
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
                <span className={`${textSizeClass} font-medium`}>
                  {getAttributeLabel(language, attrKey, g.value)}
                </span>
                <span
                  className={`${totalValues > 10 ? 'text-[10px]' : 'text-xs'} ${displayStock > 0 ? 'text-gray-500' : 'text-gray-400'}`}
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

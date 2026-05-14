'use client';

import { processImageUrl } from '../../../lib/utils/image-utils';
import { t, getAttributeLabel } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import type { Product, ProductVariant, AttributeGroupValue } from './types';
import { getOptionValue as getVariantOptionValue } from './utils/variant-helpers';
import { PDP_CARD_PREFERENCE_ORDER, PDP_PREFERENCE_ATTR_ORDER } from './constants/pdp-preference-attr-order';
import {
  isPdpCheckboxPreferenceKey,
  isPdpShownNewFormatAttributeKey,
} from './constants/pdp-checkbox-preference-keys';
import { resolvePreferenceBinaryToggle } from './utils/pdp-preference-binary-toggle';
import { logger } from '@/lib/utils/logger';

interface ProductAttributesSelectorProps {
  product: Product;
  currentVariant: ProductVariant | null;
  attributeGroups: Map<string, AttributeGroupValue[]>;
  selectedColor: string | null;
  selectedSize: string | null;
  selectedAttributeValues: Map<string, string>;
  unavailableAttributes: Map<string, boolean>;
  colorGroups: Array<{ color: string; stock: number; variants: ProductVariant[] }>;
  sizeGroups: Array<{ size: string; stock: number; variants: ProductVariant[] }>;
  language: LanguageCode;
  quantity: number;
  maxQuantity: number;
  isOutOfStock: boolean;
  isVariationRequired: boolean;
  hasUnavailableAttributes: boolean;
  canAddToCart: boolean;
  isAddingToCart: boolean;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  onQuantityAdjust: (delta: number) => void;
  onAddToCart: () => Promise<void>;
  getOptionValue: (options: unknown[] | undefined, key: string) => string | null;
  getRequiredAttributesMessage: () => string;
}

const getColorValue = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    beige: '#F5F5DC',
    black: '#000000',
    blue: '#0000FF',
    brown: '#A52A2A',
    gray: '#808080',
    grey: '#808080',
    green: '#008000',
    red: '#FF0000',
    white: '#FFFFFF',
    yellow: '#FFFF00',
    orange: '#FFA500',
    pink: '#FFC0CB',
    purple: '#800080',
    navy: '#000080',
    maroon: '#800000',
    olive: '#808000',
    teal: '#008080',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    lime: '#00FF00',
    silver: '#C0C0C0',
    gold: '#FFD700',
  };
  const normalizedName = colorName.toLowerCase().trim();
  return colorMap[normalizedName] || '#CCCCCC';
};

function sortFoodPreferenceEntriesForCard(
  entries: [string, AttributeGroupValue[]][],
): [string, AttributeGroupValue[]][] {
  const orderLen = PDP_CARD_PREFERENCE_ORDER.length;
  return [...entries].sort(([a], [b]) => {
    const ia = PDP_CARD_PREFERENCE_ORDER.indexOf(a);
    const ib = PDP_CARD_PREFERENCE_ORDER.indexOf(b);
    const ra = ia === -1 ? orderLen : ia;
    const rb = ib === -1 ? orderLen : ib;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

function sortPreferenceAttributeEntries(
  entries: [string, AttributeGroupValue[]][],
): [string, AttributeGroupValue[]][] {
  const orderLen = PDP_PREFERENCE_ATTR_ORDER.length;
  return [...entries].sort(([a], [b]) => {
    const ia = PDP_PREFERENCE_ATTR_ORDER.indexOf(a);
    const ib = PDP_PREFERENCE_ATTR_ORDER.indexOf(b);
    const ra = ia === -1 ? orderLen : ia;
    const rb = ib === -1 ? orderLen : ib;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

function resolveGenericSelectValue(
  attrKey: string,
  attrGroups: AttributeGroupValue[],
  selectedAttributeValues: Map<string, string>,
  currentVariant: ProductVariant | null,
): string {
  const fromMap = selectedAttributeValues.get(attrKey);
  if (fromMap !== undefined && fromMap !== '') return fromMap;
  const variantVal = getVariantOptionValue(currentVariant?.options, attrKey);
  if (!variantVal) return '';
  const match = attrGroups.find(
    (g) =>
      (g.valueId && g.valueId === variantVal) ||
      g.value?.toLowerCase().trim() === variantVal,
  );
  return match ? String(match.valueId || match.value) : '';
}

function preferenceAriaLabel(language: LanguageCode, attrKey: string): string {
  const path = `product.preferenceAria.${attrKey}`;
  const label = t(language, path);
  return label === path ? attrKey : label;
}

export function ProductAttributesSelector({
  product,
  currentVariant,
  attributeGroups,
  selectedColor,
  selectedSize,
  selectedAttributeValues,
  unavailableAttributes,
  colorGroups,
  sizeGroups,
  language,
  quantity,
  maxQuantity,
  isOutOfStock,
  isVariationRequired,
  hasUnavailableAttributes,
  canAddToCart,
  isAddingToCart,
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  onQuantityAdjust,
  onAddToCart,
  getOptionValue,
  getRequiredAttributesMessage,
}: ProductAttributesSelectorProps) {
  const attributeGroupsEntries = sortPreferenceAttributeEntries(
    Array.from(attributeGroups.entries()),
  );
  const visibleAttributeGroupsEntries = attributeGroupsEntries.filter(
    ([attrKey, attrGroups]) =>
      attrGroups.length > 0 && isPdpShownNewFormatAttributeKey(attrKey),
  );
  const variantDimensionEntries = visibleAttributeGroupsEntries.filter(
    ([k]) => k === 'color' || k === 'size',
  );
  const foodPreferenceEntries = sortFoodPreferenceEntriesForCard(
    visibleAttributeGroupsEntries.filter(([k]) => isPdpCheckboxPreferenceKey(k)),
  );
  logger.debug('🎨 [PRODUCT ATTRIBUTES SELECTOR] attributeGroups entries:', attributeGroupsEntries.length);
  logger.debug('🎨 [PRODUCT ATTRIBUTES SELECTOR] attributeGroups keys:', Array.from(attributeGroups.keys()));
  logger.debug('🎨 [PRODUCT ATTRIBUTES SELECTOR] product.productAttributes:', product?.productAttributes);

  const useNewFormat =
    variantDimensionEntries.length > 0 || foodPreferenceEntries.length > 0;
  const hasLegacyColor = colorGroups.length > 0;
  const hasLegacySize = !product?.productAttributes && sizeGroups.length > 0;
  if (!useNewFormat && !hasLegacyColor && !hasLegacySize) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {useNewFormat ? (
        <div className="flex w-full flex-col gap-4">
          {variantDimensionEntries.length > 0 && (
            <div className="flex w-full flex-col gap-4">
              {variantDimensionEntries.map(([attrKey, attrGroups]) => {
                if (attrGroups.length === 0) return null;
                const isColor = attrKey === 'color';
                const isUnavailable = unavailableAttributes.get(attrKey) || false;
                return (
                  <div key={attrKey} className="flex w-full flex-col gap-2">
                    <label
                      className={`text-xs font-bold uppercase ${isUnavailable ? 'text-red-600' : 'text-neutral-700'}`}
                    >
                      {isColor ? t(language, 'product.color') : t(language, 'product.size')}:
                    </label>
                    {isColor ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {attrGroups.map((g) => {
                          const isSelected = selectedColor === g.value?.toLowerCase().trim();
                          const processedImageUrl = g.imageUrl ? processImageUrl(g.imageUrl) : null;
                          const hasImage = processedImageUrl && processedImageUrl.trim() !== '';
                          const colorHex =
                            g.colors && Array.isArray(g.colors) && g.colors.length > 0
                              ? g.colors[0]
                              : getColorValue(g.value);
                          const totalValues = attrGroups.length;
                          const sizeClass =
                            totalValues > 6 ? 'w-8 h-8' : totalValues > 3 ? 'w-9 h-9' : 'w-10 h-10';
                          return (
                            <div key={g.valueId || g.value} className="flex flex-col items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => onColorSelect(g.value)}
                                className={`${sizeClass} overflow-hidden rounded-full transition-all ${
                                  isSelected
                                    ? 'scale-110 border-[3px] border-green-500'
                                    : g.stock <= 0
                                      ? 'border-2 border-gray-200 opacity-60 hover:opacity-80'
                                      : 'border-2 border-gray-300 hover:scale-105'
                                }`}
                                style={hasImage ? {} : { backgroundColor: colorHex }}
                                title={`${getAttributeLabel(language, attrKey, g.value)}${g.stock > 0 ? ` (${g.stock} ${t(language, 'product.pcs')})` : ` (${t(language, 'product.outOfStock')})`}`}
                              >
                                {hasImage && processedImageUrl ? (
                                  <img
                                    src={processedImageUrl}
                                    alt={g.label}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      logger.warn('[COLOR IMAGE] Failed to load', {
                                        color: g.value,
                                        url: processedImageUrl,
                                      });
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                    onLoad={() => {
                                      logger.debug('[COLOR IMAGE] Loaded', { color: g.value });
                                    }}
                                  />
                                ) : null}
                              </button>
                              {g.stock > 0 && (
                                <span
                                  className={`${totalValues > 8 ? 'text-[10px]' : 'text-xs'} text-gray-500`}
                                >
                                  {g.stock}
                                </span>
                              )}
                              {g.stock <= 0 && (
                                <span
                                  className={`${totalValues > 8 ? 'text-[10px]' : 'text-xs'} text-gray-400`}
                                >
                                  0
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {attrGroups.map((g) => {
                          const displayStock = g.stock;
                          const isSelected = selectedSize === g.value.toLowerCase().trim();
                          const processedImageUrl = g.imageUrl ? processImageUrl(g.imageUrl) : null;
                          const hasImage = processedImageUrl && processedImageUrl.trim() !== '';
                          const totalValues = attrGroups.length;
                          const paddingClass =
                            totalValues > 6 ? 'px-2 py-1' : totalValues > 3 ? 'px-2.5 py-1.5' : 'px-3 py-2';
                          const textSizeClass = totalValues > 6 ? 'text-xs' : 'text-sm';
                          const imageSizeClass = totalValues > 6 ? 'w-4 h-4' : 'w-5 h-5';
                          const minWidthClass = totalValues > 6 ? 'min-w-[40px]' : 'min-w-[50px]';
                          return (
                            <button
                              type="button"
                              key={g.valueId || g.value}
                              onClick={() => onSizeSelect(g.value)}
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
                                    logger.warn('[SIZE IMAGE] Failed to load', {
                                      size: g.value,
                                      url: processedImageUrl,
                                    });
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                  onLoad={() => {
                                    logger.debug('[SIZE IMAGE] Loaded', { size: g.value });
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
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {foodPreferenceEntries.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:gap-4">
                {foodPreferenceEntries.map(([attrKey, attrGroups]) => {
                  if (attrGroups.length === 0) return null;
                  const isUnavailable = unavailableAttributes.get(attrKey) || false;
                  const selectedPrefValue = resolveGenericSelectValue(
                    attrKey,
                    attrGroups,
                    selectedAttributeValues,
                    currentVariant,
                  );
                  const toggle = resolvePreferenceBinaryToggle(attrKey, attrGroups);
                  if (!toggle) return null;
                  const inputId = `pdp-pref-${attrKey}-toggle`;
                  const isChecked = selectedPrefValue === toggle.onVal;
                  return (
                    <div
                      key={attrKey}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2"
                      aria-invalid={isUnavailable}
                    >
                      <span className="sr-only">{preferenceAriaLabel(language, attrKey)}</span>
                      <label
                        htmlFor={inputId}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm text-neutral-800"
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            onAttributeValueSelect(
                              attrKey,
                              e.target.checked ? toggle.onVal : toggle.offVal,
                            );
                          }}
                          className="h-4 w-4 shrink-0 rounded border-neutral-300 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0"
                        />
                        <span>{getAttributeLabel(language, attrKey, toggle.onSlug)}</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-full flex-col gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 sm:p-5">
          {colorGroups.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t(language, 'product.color')}:</label>
              <div className="flex flex-wrap items-center gap-2">
                {colorGroups.map((g) => {
                  const isSelected = selectedColor === g.color?.toLowerCase().trim();
                  const isDisabled = g.stock <= 0;

                  return (
                    <div key={g.color} className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => !isDisabled && onColorSelect(g.color)}
                        disabled={isDisabled}
                        className={`h-10 w-10 rounded-full transition-all ${
                          isSelected
                            ? 'scale-110 border-[3px] border-green-500'
                            : isDisabled
                              ? 'cursor-not-allowed border-2 border-gray-100 opacity-30 grayscale'
                              : 'border-2 border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: getColorValue(g.color) }}
                        title={
                          isDisabled
                            ? `${getAttributeLabel(language, 'color', g.color)} (${t(language, 'product.outOfStock')})`
                            : `${getAttributeLabel(language, 'color', g.color)}${g.stock > 0 ? ` (${g.stock} ${t(language, 'product.pcs')})` : ''}`
                        }
                      />
                      {g.stock > 0 && <span className="text-xs text-gray-500">{g.stock}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!product?.productAttributes && sizeGroups.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">{t(language, 'product.size')}</label>
              <div className="flex flex-wrap gap-2">
                {sizeGroups.map((g) => {
                  let displayStock = g.stock;
                  if (selectedColor) {
                    const v = g.variants.find((variant) => {
                      const colorOpt = getOptionValue(variant.options, 'color');
                      return colorOpt === selectedColor.toLowerCase().trim();
                    });
                    displayStock = v ? v.stock : 0;
                  }
                  const isSelected = selectedSize === g.size;
                  const isDisabled = displayStock <= 0;

                  return (
                    <button
                      type="button"
                      key={g.size}
                      onClick={() => !isDisabled && onSizeSelect(g.size)}
                      disabled={isDisabled}
                      className={`min-w-[50px] rounded-lg border-2 px-3 py-2 transition-all ${
                        isSelected
                          ? 'border-green-500 bg-gray-50'
                          : isDisabled
                            ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-50'
                            : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex flex-col text-center">
                        <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                          {getAttributeLabel(language, 'size', g.size)}
                        </span>
                        {displayStock > 0 && (
                          <span className={`text-xs ${isDisabled ? 'text-gray-300' : 'text-gray-500'}`}>
                            {displayStock} {t(language, 'product.pcs')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

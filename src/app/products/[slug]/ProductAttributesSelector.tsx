'use client';

import { processImageUrl } from '../../../lib/utils/image-utils';
import { t, getAttributeLabel } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import type { Product, ProductVariant, AttributeGroupValue } from './types';
import { getOptionValue as getVariantOptionValue } from './utils/variant-helpers';
import { PDP_CARD_PREFERENCE_ORDER, PDP_PREFERENCE_ATTR_ORDER } from './constants/pdp-preference-attr-order';
import { isPdpCheckboxPreferenceKey } from './constants/pdp-checkbox-preference-keys';
import { resolvePreferenceBinaryToggle } from './utils/pdp-preference-binary-toggle';
import { PdpAttributePillRow } from './PdpAttributePillRow';
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
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  getOptionValue: (options: unknown[] | undefined, key: string) => string | null;
}

/** PDP attribute blocks — soft card, consistent with product chrome. */
const PDP_ATTR_SECTION_CARD =
  'rounded-2xl border border-neutral-200/80 bg-gradient-to-b from-white to-neutral-50/60 p-4 shadow-sm ring-1 ring-neutral-950/[0.04] sm:p-5';

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

function attributeNameFromProduct(product: Product, attrKey: string): string {
  return (
    product.productAttributes?.find((pa) => pa.attribute.key === attrKey)?.attribute.name ?? attrKey
  );
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
  onColorSelect,
  onSizeSelect,
  onAttributeValueSelect,
  getOptionValue,
}: ProductAttributesSelectorProps) {
  const attributeGroupsEntries = sortPreferenceAttributeEntries(
    Array.from(attributeGroups.entries()),
  );
  const visibleAttributeGroupsEntries = attributeGroupsEntries.filter(
    ([, attrGroups]) => attrGroups.length > 0,
  );
  const variantDimensionEntries = visibleAttributeGroupsEntries.filter(
    ([k]) => k === 'color' || k === 'size',
  );
  const foodPreferenceEntries = sortFoodPreferenceEntriesForCard(
    visibleAttributeGroupsEntries.filter(([k]) => isPdpCheckboxPreferenceKey(k)),
  );
  const genericDimensionEntries = visibleAttributeGroupsEntries.filter(
    ([k]) => k !== 'color' && k !== 'size' && !isPdpCheckboxPreferenceKey(k),
  );
  logger.debug('🎨 [PRODUCT ATTRIBUTES SELECTOR] attributeGroups entries:', attributeGroupsEntries.length);
  logger.debug('🎨 [PRODUCT ATTRIBUTES SELECTOR] attributeGroups keys:', Array.from(attributeGroups.keys()));
  logger.debug('🎨 [PRODUCT ATTRIBUTES SELECTOR] product.productAttributes:', product?.productAttributes);

  const useNewFormat =
    variantDimensionEntries.length > 0 ||
    foodPreferenceEntries.length > 0 ||
    genericDimensionEntries.length > 0;
  const hasLegacyColor = colorGroups.length > 0;
  const hasLegacySize = !product?.productAttributes && sizeGroups.length > 0;
  if (!useNewFormat && !hasLegacyColor && !hasLegacySize) {
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      {useNewFormat ? (
        <div className="flex w-full flex-col gap-5">
          {variantDimensionEntries.length > 0 && (
            <div className={PDP_ATTR_SECTION_CARD}>
              <div className="flex flex-col gap-6">
              {variantDimensionEntries.map(([attrKey, attrGroups]) => {
                if (attrGroups.length === 0) return null;
                const isColor = attrKey === 'color';
                const isUnavailable = unavailableAttributes.get(attrKey) || false;
                return (
                  <div key={attrKey} className="flex w-full flex-col gap-2.5">
                    <label
                      className={`block text-sm font-semibold tracking-tight ${isUnavailable ? 'text-red-600' : 'text-neutral-900'}`}
                    >
                      {isColor ? t(language, 'product.color') : t(language, 'product.size')}:
                    </label>
                    {isColor ? (
                      <div className="flex flex-wrap items-center gap-2">
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
                            totalValues > 6 ? 'h-8 w-8' : totalValues > 3 ? 'h-9 w-9' : 'h-10 w-10';
                          return (
                            <div key={g.valueId || g.value} className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onColorSelect(g.value)}
                                className={`${sizeClass} overflow-hidden rounded-full shadow-sm transition-all duration-200 ${
                                  isSelected
                                    ? 'scale-105 ring-[3px] ring-[#F66812] ring-offset-2 ring-offset-white'
                                    : g.stock <= 0
                                      ? 'ring-2 ring-neutral-200 opacity-50 grayscale hover:opacity-70'
                                      : 'ring-2 ring-neutral-200/90 hover:scale-105 hover:ring-neutral-300'
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
                                  className={`tabular-nums ${totalValues > 8 ? 'text-[10px]' : 'text-xs'} text-neutral-500`}
                                >
                                  {g.stock}
                                </span>
                              )}
                              {g.stock <= 0 && (
                                <span
                                  className={`tabular-nums ${totalValues > 8 ? 'text-[10px]' : 'text-xs'} text-neutral-400`}
                                >
                                  0
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {attrGroups.map((g) => {
                          const displayStock = g.stock;
                          const isSelected = selectedSize === g.value.toLowerCase().trim();
                          const processedImageUrl = g.imageUrl ? processImageUrl(g.imageUrl) : null;
                          const hasImage = processedImageUrl && processedImageUrl.trim() !== '';
                          const totalValues = attrGroups.length;
                          const paddingClass =
                            totalValues > 6 ? 'px-2 py-1.5' : totalValues > 3 ? 'px-2.5 py-2' : 'px-3 py-2';
                          const textSizeClass = totalValues > 6 ? 'text-xs' : 'text-sm';
                          const imageSizeClass = totalValues > 6 ? 'h-4 w-4' : 'h-5 w-5';
                          const minWidthClass = totalValues > 6 ? 'min-w-[2.5rem]' : 'min-w-[3rem]';
                          return (
                            <button
                              type="button"
                              key={g.valueId || g.value}
                              onClick={() => onSizeSelect(g.value)}
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
                                <span
                                  className={`${textSizeClass} font-medium text-neutral-900`}
                                >
                                  {getAttributeLabel(language, attrKey, g.value)}
                                </span>
                                <span
                                  className={`tabular-nums ${totalValues > 10 ? 'text-[10px]' : 'text-xs'} ${displayStock > 0 ? 'text-neutral-500' : 'text-neutral-400'}`}
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
            </div>
          )}
          {genericDimensionEntries.length > 0 && (
            <div className={PDP_ATTR_SECTION_CARD}>
              <div className="flex flex-col gap-5">
              {genericDimensionEntries.map(([attrKey, attrGroups]) => (
                <PdpAttributePillRow
                  key={attrKey}
                  attrKey={attrKey}
                  title={attributeNameFromProduct(product, attrKey)}
                  attrGroups={attrGroups}
                  language={language}
                  selectedAttributeValues={selectedAttributeValues}
                  currentVariant={currentVariant}
                  unavailableAttributes={unavailableAttributes}
                  onAttributeValueSelect={onAttributeValueSelect}
                />
              ))}
              </div>
            </div>
          )}
          {genericDimensionEntries.length > 0 && (
            <div className="flex w-full flex-col gap-4">
              {genericDimensionEntries.map(([attrKey, attrGroups]) => (
                <PdpAttributePillRow
                  key={attrKey}
                  attrKey={attrKey}
                  title={attributeNameFromProduct(product, attrKey)}
                  attrGroups={attrGroups}
                  language={language}
                  selectedAttributeValues={selectedAttributeValues}
                  currentVariant={currentVariant}
                  unavailableAttributes={unavailableAttributes}
                  onAttributeValueSelect={onAttributeValueSelect}
                />
              ))}
            </div>
          )}
          {foodPreferenceEntries.length > 0 && (
            <div className={PDP_ATTR_SECTION_CARD}>
              <div className="flex flex-col gap-4 sm:gap-5">
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
                  if (!toggle) {
                    if (attrGroups.length <= 1) {
                      const raw = selectedPrefValue;
                      const selectedGroup =
                        raw !== ''
                          ? attrGroups.find(
                              (g) =>
                                (g.valueId !== undefined &&
                                  g.valueId !== '' &&
                                  g.valueId === raw) ||
                                g.value?.toLowerCase().trim() === raw.toLowerCase().trim(),
                            )
                          : undefined;
                      const display = selectedGroup ?? attrGroups[0];
                      const attrLabel = attributeNameFromProduct(product, attrKey);
                      return (
                        <div
                          key={attrKey}
                          className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-neutral-800"
                          aria-invalid={isUnavailable}
                        >
                          <span className="sr-only">{preferenceAriaLabel(language, attrKey)}</span>
                          <span className="font-semibold text-neutral-700">{attrLabel}:</span>
                          <span>{getAttributeLabel(language, attrKey, display.value)}</span>
                        </div>
                      );
                    }
                    return (
                      <PdpAttributePillRow
                        key={attrKey}
                        attrKey={attrKey}
                        title={attributeNameFromProduct(product, attrKey)}
                        attrGroups={attrGroups}
                        language={language}
                        selectedAttributeValues={selectedAttributeValues}
                        currentVariant={currentVariant}
                        unavailableAttributes={unavailableAttributes}
                        onAttributeValueSelect={onAttributeValueSelect}
                      />
                    );
                  }
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
                          className="pdp-preference-checkbox"
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
        <div className={`flex w-full flex-col gap-6 ${PDP_ATTR_SECTION_CARD}`}>
          {colorGroups.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-sm font-semibold tracking-tight text-neutral-900">
                {t(language, 'product.color')}:
              </label>
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
                        className={`h-10 w-10 rounded-full shadow-sm transition-all duration-200 ${
                          isSelected
                            ? 'scale-105 ring-[3px] ring-[#F66812] ring-offset-2 ring-offset-white'
                            : isDisabled
                              ? 'cursor-not-allowed ring-2 ring-neutral-200 opacity-40 grayscale'
                              : 'ring-2 ring-neutral-200/90 hover:scale-105 hover:ring-neutral-300'
                        }`}
                        style={{ backgroundColor: getColorValue(g.color) }}
                        title={
                          isDisabled
                            ? `${getAttributeLabel(language, 'color', g.color)} (${t(language, 'product.outOfStock')})`
                            : `${getAttributeLabel(language, 'color', g.color)}${g.stock > 0 ? ` (${g.stock} ${t(language, 'product.pcs')})` : ''}`
                        }
                      />
                      {g.stock > 0 && (
                        <span className="text-xs tabular-nums text-neutral-500">{g.stock}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!product?.productAttributes && sizeGroups.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-sm font-semibold tracking-tight text-neutral-900">
                {t(language, 'product.size')}:
              </label>
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
                      className={`min-w-[3rem] rounded-xl border bg-white px-3 py-2 shadow-sm transition-all duration-200 ${
                        isSelected
                          ? 'border-[#F66812] bg-orange-50/90 ring-1 ring-[#F66812]/25'
                          : isDisabled
                            ? 'cursor-not-allowed border-neutral-200/80 opacity-50'
                            : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex flex-col text-center">
                        <span
                          className={`text-sm font-medium ${isDisabled ? 'text-neutral-400' : 'text-neutral-900'}`}
                        >
                          {getAttributeLabel(language, 'size', g.size)}
                        </span>
                        {displayStock > 0 && (
                          <span
                            className={`text-xs tabular-nums ${isDisabled ? 'text-neutral-400' : 'text-neutral-500'}`}
                          >
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

'use client';

import { processImageUrl } from '../../../lib/utils/image-utils';
import { t, getAttributeLabel } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import type { Product, ProductVariant } from './types';
import { logger } from "@/lib/utils/logger";

interface AttributeGroupValue {
  valueId?: string;
  value: string;
  label: string;
  stock: number;
  variants: ProductVariant[];
  imageUrl?: string | null;
  colors?: string[] | null;
}

interface ProductAttributesSelectorProps {
  product: Product;
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
  showMessage: string | null;
  onColorSelect: (color: string) => void;
  onSizeSelect: (size: string) => void;
  onAttributeValueSelect: (attrKey: string, value: string) => void;
  onQuantityAdjust: (delta: number) => void;
  onAddToCart: () => Promise<void>;
  getOptionValue: (options: any[] | undefined, key: string) => string | null;
  getRequiredAttributesMessage: () => string;
}

// Helper function to get color hex/rgb from color name
const getColorValue = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'beige': '#F5F5DC', 'black': '#000000', 'blue': '#0000FF', 'brown': '#A52A2A',
    'gray': '#808080', 'grey': '#808080', 'green': '#008000', 'red': '#FF0000',
    'white': '#FFFFFF', 'yellow': '#FFFF00', 'orange': '#FFA500', 'pink': '#FFC0CB',
    'purple': '#800080', 'navy': '#000080', 'maroon': '#800000', 'olive': '#808000',
    'teal': '#008080', 'cyan': '#00FFFF', 'magenta': '#FF00FF', 'lime': '#00FF00',
    'silver': '#C0C0C0', 'gold': '#FFD700',
  };
  const normalizedName = colorName.toLowerCase().trim();
  return colorMap[normalizedName] || '#CCCCCC';
};

export function ProductAttributesSelector({
  product,
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
  const attributeGroupsEntries = Array.from(attributeGroups.entries());
  logger.debug('🎨 [PRODUCT ATTRIBUTES SELECTOR] attributeGroups entries:', attributeGroupsEntries.length);
  logger.debug('🎨 [PRODUCT ATTRIBUTES SELECTOR] attributeGroups keys:', Array.from(attributeGroups.keys()));
  logger.debug('🎨 [PRODUCT ATTRIBUTES SELECTOR] product.productAttributes:', product?.productAttributes);

  const useNewFormat = attributeGroupsEntries.some(([, arr]) => arr.length > 0);
  const hasLegacyColor = colorGroups.length > 0;
  const hasLegacySize = !product?.productAttributes && sizeGroups.length > 0;
  if (!useNewFormat && !hasLegacyColor && !hasLegacySize) {
    return null;
  }

  return (
    <div className="mt-8 p-4 bg-white border border-gray-200 rounded-2xl space-y-4">
      {/* Attribute Selectors - Support both new (productAttributes) and old (colorGroups) format */}
      {/* Display all attributes from attributeGroups, not just from productAttributes */}
      {useNewFormat ? (
<<<<<<< HEAD
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
<<<<<<< HEAD
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
=======
>>>>>>> 7aba160 (cart style and deleted /cart)
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
=======
        // Use attributeGroups which contains all attributes (from productAttributes and variants)
        Array.from(attributeGroups.entries()).map(([attrKey, attrGroups]) => {
          // Try to get attribute name from productAttributes if available
          const productAttr = product?.productAttributes?.find((pa: any) => pa.attribute?.key === attrKey);
          const attributeName = productAttr?.attribute?.name || attrKey.charAt(0).toUpperCase() + attrKey.slice(1);
          const isColor = attrKey === 'color';
          const isSize = attrKey === 'size';

          if (attrGroups.length === 0) return null;

          // Check if this attribute is unavailable for the selected variant
          const isUnavailable = unavailableAttributes.get(attrKey) || false;
          
          return (
            <div key={attrKey} className="space-y-1.5">
              <label className={`text-xs font-bold uppercase ${isUnavailable ? 'text-red-600' : ''}`}>
                {attrKey === 'color' ? t(language, 'product.color') : 
                 attrKey === 'size' ? t(language, 'product.size') : 
                 attributeName}:
>>>>>>> b04fde2 (c)
              </label>
              {isColor ? (
                <div className="flex flex-wrap gap-1.5 items-center">
                  {attrGroups.map((g) => {
                    const isSelected = selectedColor === g.value?.toLowerCase().trim();
                    // IMPORTANT: Don't disable based on stock - show all colors, even if stock is 0
                    // Stock is just informational, not a reason to hide the option
                    const isDisabled = false; // Always show all colors
                    // Process imageUrl to ensure it's in the correct format
                    const processedImageUrl = g.imageUrl ? processImageUrl(g.imageUrl) : null;
                    const hasImage = processedImageUrl && processedImageUrl.trim() !== '';
                    const colorHex = g.colors && Array.isArray(g.colors) && g.colors.length > 0 
                      ? g.colors[0] 
                      : getColorValue(g.value);
                    
                    // Dynamic sizing based on number of values
                    // Keep size consistent for 2 values, reduce for more
                    const totalValues = attrGroups.length;
                    const sizeClass = totalValues > 6 
                      ? 'w-8 h-8' 
                      : totalValues > 3 
                      ? 'w-9 h-9' 
                      : 'w-10 h-10';
                    
                    return (
                      <div key={g.valueId || g.value} className="flex flex-col items-center gap-0.5">
                        <button 
                          onClick={() => onColorSelect(g.value)}
                          className={`${sizeClass} rounded-full transition-all overflow-hidden ${
                            isSelected 
                              ? 'border-[3px] border-green-500 scale-110' 
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
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`❌ [COLOR IMAGE] Failed to load image for color "${g.value}":`, processedImageUrl);
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                              onLoad={() => {
                                logger.debug(`✅ [COLOR IMAGE] Successfully loaded image for color "${g.value}":`, processedImageUrl);
                              }}
                            />
                          ) : null}
                        </button>
                        {g.stock > 0 && (
                          <span className={`${totalValues > 8 ? 'text-[10px]' : 'text-xs'} text-gray-500`}>{g.stock}</span>
                        )}
                        {g.stock <= 0 && (
                          <span className={`${totalValues > 8 ? 'text-[10px]' : 'text-xs'} text-gray-400`}>0</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : isSize ? (
                <div className="flex flex-wrap gap-1.5">
                  {attrGroups.map((g) => {
                    // Use stock from groups (already calculated with compatibility)
                    const displayStock = g.stock;
                    const isSelected = selectedSize === g.value.toLowerCase().trim();
                    // IMPORTANT: Don't disable based on stock - show all sizes, even if stock is 0
                    // Stock is just informational, not a reason to hide the option
                    const isDisabled = false; // Always show all sizes
                    
                    // Process imageUrl to ensure it's in the correct format
                    const processedImageUrl = g.imageUrl ? processImageUrl(g.imageUrl) : null;
                    const hasImage = processedImageUrl && processedImageUrl.trim() !== '';
                    
                    // Dynamic sizing based on number of values
                    // Keep size consistent for 2 values, reduce for more
                    const totalValues = attrGroups.length;
                    const paddingClass = totalValues > 6 
                      ? 'px-2 py-1' 
                      : totalValues > 3 
                      ? 'px-2.5 py-1.5' 
                      : 'px-3 py-2';
                    const textSizeClass = totalValues > 6 
                      ? 'text-xs' 
                      : 'text-sm';
                    const imageSizeClass = totalValues > 6 
                      ? 'w-4 h-4' 
                      : 'w-5 h-5';
                    const minWidthClass = totalValues > 6 
                      ? 'min-w-[40px]' 
                      : 'min-w-[50px]';

                    return (
                      <button 
                        key={g.valueId || g.value}
                        onClick={() => onSizeSelect(g.value)}
                        className={`${minWidthClass} ${paddingClass} rounded-lg border-2 transition-all flex items-center gap-1.5 ${
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
                            className={`${imageSizeClass} object-cover rounded border border-gray-300 flex-shrink-0`}
                            onError={(e) => {
                              console.error(`❌ [SIZE IMAGE] Failed to load image for size "${g.value}":`, processedImageUrl);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            onLoad={() => {
                              logger.debug(`✅ [SIZE IMAGE] Successfully loaded image for size "${g.value}":`, processedImageUrl);
                            }}
                          />
                        )}
                        <div className="flex flex-col text-center">
                          <span className={`${textSizeClass} font-medium`}>{getAttributeLabel(language, attrKey, g.value)}</span>
                          <span className={`${totalValues > 10 ? 'text-[10px]' : 'text-xs'} ${displayStock > 0 ? 'text-gray-500' : 'text-gray-400'}`}>({displayStock})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                // Generic attribute selector
                <div className="flex flex-wrap gap-1.5">
                  {attrGroups.map((g) => {
                    const selectedValueId = selectedAttributeValues.get(attrKey);
                    const isSelected = selectedValueId === g.valueId || (!g.valueId && selectedColor === g.value);
                    // IMPORTANT: Don't disable based on stock - show all attribute values, even if stock is 0
                    // Stock is just informational, not a reason to hide the option
                    const isDisabled = false; // Always show all attribute values
                    
                    // Process imageUrl to ensure it's in the correct format
                    const processedImageUrl = g.imageUrl ? processImageUrl(g.imageUrl) : null;
                    const hasImage = processedImageUrl && processedImageUrl.trim() !== '';
                    const hasColors = g.colors && Array.isArray(g.colors) && g.colors.length > 0;
                    const colorHex = hasColors && g.colors 
                      ? g.colors[0] 
                      : null;
                    
                    // Debug logging for image issues
                    if (g.imageUrl && !hasImage) {
                      console.warn(`⚠️ [ATTRIBUTE IMAGE] Failed to process imageUrl for attribute "${attrKey}" value "${g.value}":`, g.imageUrl);
                    }
                    
                    // Dynamic sizing based on number of values
                    // Keep size consistent for 2 values, reduce for more
                    const totalValues = attrGroups.length;
                    const paddingClass = totalValues > 6 
                      ? 'px-2 py-1' 
                      : totalValues > 3 
                      ? 'px-3 py-1.5' 
                      : 'px-4 py-2';
                    const textSizeClass = totalValues > 6 
                      ? 'text-xs' 
                      : 'text-sm';
                    const imageSizeClass = totalValues > 6 
                      ? 'w-4 h-4' 
                      : totalValues > 3 
                      ? 'w-5 h-5' 
                      : 'w-6 h-6';
                    const gapClass = totalValues > 6 
                      ? 'gap-1' 
                      : 'gap-2';

                    return (
                      <button
                        key={g.valueId || g.value}
                        onClick={() => {
                          if (!isDisabled) {
                            onAttributeValueSelect(attrKey, g.valueId || g.value);
                          }
                        }}
                        className={`${paddingClass} rounded-lg border-2 transition-all flex items-center ${gapClass} ${
                          isSelected
                            ? 'border-green-500 bg-gray-50'
                            : g.stock <= 0
                              ? 'border-gray-200 opacity-60 hover:opacity-80'
                              : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={!hasImage && colorHex ? { backgroundColor: colorHex } : {}}
                      >
                        {hasImage && processedImageUrl ? (
                          <img 
                            src={processedImageUrl} 
                            alt={g.label}
                            className={`${imageSizeClass} object-cover rounded border border-gray-300 flex-shrink-0`}
                            onError={(e) => {
                              console.error(`❌ [ATTRIBUTE IMAGE] Failed to load image for attribute "${attrKey}" value "${g.value}":`, processedImageUrl);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                            onLoad={() => {
                              logger.debug(`✅ [ATTRIBUTE IMAGE] Successfully loaded image for attribute "${attrKey}" value "${g.value}":`, processedImageUrl);
                            }}
                          />
                        ) : hasColors && colorHex ? (
                          <div 
                            className={`${imageSizeClass} rounded border border-gray-300 flex-shrink-0`}
                            style={{ backgroundColor: colorHex }}
                          />
                        ) : null}
                        <div className="flex flex-col text-center">
                          <span className={textSizeClass}>{getAttributeLabel(language, attrKey, g.value)}</span>
                          <span className={`${totalValues > 10 ? 'text-[10px]' : 'text-xs'} ${g.stock > 0 ? 'text-gray-500' : 'text-gray-400'}`}>({g.stock})</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      ) : (
        // Old format: Use colorGroups and sizeGroups
        <>
          {colorGroups.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t(language, 'product.color')}:</label>
              <div className="flex flex-wrap gap-2 items-center">
                {colorGroups.map((g) => {
                  const isSelected = selectedColor === g.color?.toLowerCase().trim();
                  const isDisabled = g.stock <= 0;
                  
                  return (
                    <div key={g.color} className="flex flex-col items-center gap-1">
                      <button 
                        onClick={() => !isDisabled && onColorSelect(g.color)}
                        disabled={isDisabled}
                        className={`w-10 h-10 rounded-full transition-all ${
                          isSelected 
                            ? 'border-[3px] border-green-500 scale-110' 
                            : isDisabled 
                              ? 'border-2 border-gray-100 opacity-30 grayscale cursor-not-allowed' 
                              : 'border-2 border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: getColorValue(g.color) }} 
                        title={isDisabled ? `${getAttributeLabel(language, 'color', g.color)} (${t(language, 'product.outOfStock')})` : `${getAttributeLabel(language, 'color', g.color)}${g.stock > 0 ? ` (${g.stock} ${t(language, 'product.pcs')})` : ''}`} 
                      />
                      {g.stock > 0 && (
                        <span className="text-xs text-gray-500">{g.stock}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Size Groups - Show only if not using new format */}
      {!product?.productAttributes && sizeGroups.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase">{t(language, 'product.size')}</label>
          <div className="flex flex-wrap gap-2">
            {sizeGroups.map((g) => {
              let displayStock = g.stock;
              if (selectedColor) {
                const v = g.variants.find(v => {
                  const colorOpt = getOptionValue(v.options, 'color');
                  return colorOpt === selectedColor.toLowerCase().trim();
                });
                displayStock = v ? v.stock : 0;
              }
              const isSelected = selectedSize === g.size;
              const isDisabled = displayStock <= 0;

              return (
                <button 
                  key={g.size} 
                  onClick={() => !isDisabled && onSizeSelect(g.size)}
                  disabled={isDisabled}
                  className={`min-w-[50px] px-3 py-2 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? 'border-green-500 bg-gray-50' 
                      : isDisabled 
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' 
                        : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex flex-col text-center">
                    <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>{getAttributeLabel(language, 'size', g.size)}</span>
                    {displayStock > 0 && (
                      <span className={`text-xs ${isDisabled ? 'text-gray-300' : 'text-gray-500'}`}>{displayStock} {t(language, 'product.pcs')}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}




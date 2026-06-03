import { getAttributeLabel } from '../../../../lib/i18n';
import type { LanguageCode } from '../../../../lib/language';
import type { Product } from '../types';
import {
  isPdpCustomizationAttributeKey,
  PDP_CUSTOMIZATION_EXCLUDED_VALUE_SLUGS,
} from '../constants/pdp-customization-ingredients';

export type PdpCustomizationIngredientOption = {
  id: string;
  label: string;
};

function isExcludedCustomizationValueSlug(valueSlug: string): boolean {
  const normalized = valueSlug.toLowerCase().trim();
  return PDP_CUSTOMIZATION_EXCLUDED_VALUE_SLUGS.some(
    (slug) => slug.toLowerCase() === normalized,
  );
}

function extractIngredientsFromProduct(
  product: Product,
  language: LanguageCode,
): PdpCustomizationIngredientOption[] {
  const attrs = product.productAttributes;
  if (!attrs?.length) {
    return [];
  }

  const options: PdpCustomizationIngredientOption[] = [];
  const seen = new Set<string>();

  for (const productAttr of attrs) {
    const attrKey = productAttr.attribute.key;
    if (!isPdpCustomizationAttributeKey(attrKey)) {
      continue;
    }

    for (const value of productAttr.attribute.values) {
      const valueSlug = value.value?.trim() ?? '';
      if (!valueSlug || isExcludedCustomizationValueSlug(valueSlug)) {
        continue;
      }

      const label = getAttributeLabel(language, attrKey, valueSlug);
      if (!label || seen.has(label)) {
        continue;
      }
      seen.add(label);
      options.push({
        id: value.id || `${attrKey}:${valueSlug}`,
        label,
      });
    }
  }

  return options;
}

/** Ingredient options for Add / Exclude pills — only attributes linked to the product. */
export function resolvePdpCustomizationIngredients(
  product: Product | null | undefined,
  language: LanguageCode,
): PdpCustomizationIngredientOption[] {
  if (!product) {
    return [];
  }
  return extractIngredientsFromProduct(product, language);
}

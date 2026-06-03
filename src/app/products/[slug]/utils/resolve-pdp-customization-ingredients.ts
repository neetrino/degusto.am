import { getAttributeLabel, t } from '../../../../lib/i18n';
import type { LanguageCode } from '../../../../lib/language';
import type { Product } from '../types';
import {
  PDP_CUSTOMIZATION_INGREDIENT_ATTR_KEYS,
  PDP_DEFAULT_CUSTOMIZATION_INGREDIENT_IDS,
  type PdpDefaultCustomizationIngredientId,
} from '../constants/pdp-customization-ingredients';

export type PdpCustomizationIngredientOption = {
  id: string;
  label: string;
};

function resolveDefaultIngredientLabel(
  language: LanguageCode,
  id: PdpDefaultCustomizationIngredientId,
): string {
  return t(language, `product.customizationIngredients.${id}`);
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
    if (!PDP_CUSTOMIZATION_INGREDIENT_ATTR_KEYS.includes(attrKey as (typeof PDP_CUSTOMIZATION_INGREDIENT_ATTR_KEYS)[number])) {
      continue;
    }

    for (const value of productAttr.attribute.values) {
      const label = getAttributeLabel(language, attrKey, value.value);
      if (!label || seen.has(label)) {
        continue;
      }
      seen.add(label);
      options.push({
        id: value.id || `${attrKey}:${value.value}`,
        label,
      });
    }
  }

  return options;
}

/** Ingredient options for Add / Exclude pills — product attributes first, then catalog. */
export function resolvePdpCustomizationIngredients(
  product: Product | null | undefined,
  language: LanguageCode,
): PdpCustomizationIngredientOption[] {
  if (product) {
    const fromProduct = extractIngredientsFromProduct(product, language);
    if (fromProduct.length > 0) {
      return fromProduct;
    }
  }

  return PDP_DEFAULT_CUSTOMIZATION_INGREDIENT_IDS.map((id) => ({
    id,
    label: resolveDefaultIngredientLabel(language, id),
  }));
}

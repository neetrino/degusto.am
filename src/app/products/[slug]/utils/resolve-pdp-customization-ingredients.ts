import { normalizePriceAdjustment } from '@/lib/attributes/price-adjustment';
import {
  parsePdpCustomizationConfig,
  roleByValueId,
  type PdpCustomizationRole,
} from '@/lib/products/pdp-customization-config';
import { getAttributeLabel } from '../../../../lib/i18n';
import type { LanguageCode } from '../../../../lib/language';
import type { Product, ProductVariant } from '../types';
import {
  isPdpCustomizationAttributeKey,
  PDP_CUSTOMIZATION_DEFAULT_ATTR_KEYS,
  PDP_CUSTOMIZATION_EXCLUDED_VALUE_SLUGS,
  PDP_CUSTOMIZATION_OPTIONAL_ATTR_KEYS,
} from '../constants/pdp-customization-ingredients';

export type PdpCustomizationIngredientOption = {
  id: string;
  label: string;
  valueSlug: string;
  attrKey: string;
  priceAdjustment: number;
};

export type PdpCustomizationOptionSets = {
  /** Included with the product — Exclude pill (removing does not change price). */
  defaultIncluded: PdpCustomizationIngredientOption[];
  /** Optional paid extras — Add pill (adds priceAdjustment when selected). */
  optionalAdd: PdpCustomizationIngredientOption[];
};

function isExcludedCustomizationValueSlug(valueSlug: string): boolean {
  const normalized = valueSlug.toLowerCase().trim();
  return PDP_CUSTOMIZATION_EXCLUDED_VALUE_SLUGS.some(
    (slug) => slug.toLowerCase() === normalized,
  );
}

function isDefaultAttrKey(attrKey: string): boolean {
  return PDP_CUSTOMIZATION_DEFAULT_ATTR_KEYS.includes(
    attrKey as (typeof PDP_CUSTOMIZATION_DEFAULT_ATTR_KEYS)[number],
  );
}

function isOptionalAttrKey(attrKey: string): boolean {
  return PDP_CUSTOMIZATION_OPTIONAL_ATTR_KEYS.includes(
    attrKey as (typeof PDP_CUSTOMIZATION_OPTIONAL_ATTR_KEYS)[number],
  );
}

function collectVariantCustomizationValueIds(
  variant: ProductVariant | null | undefined,
): Set<string> {
  const ids = new Set<string>();
  if (!variant?.options?.length) {
    return ids;
  }
  for (const opt of variant.options) {
    const key = opt.key || opt.attribute || '';
    if (!key || !isPdpCustomizationAttributeKey(key)) {
      continue;
    }
    if (typeof opt.valueId === 'string' && opt.valueId.trim()) {
      ids.add(opt.valueId.trim());
    }
  }
  return ids;
}

type RawCustomizationRow = {
  id: string;
  label: string;
  valueSlug: string;
  attrKey: string;
  priceAdjustment: number;
  configuredRole?: PdpCustomizationRole;
};

function buildRawRows(product: Product, language: LanguageCode): RawCustomizationRow[] {
  const attrs = product.productAttributes;
  if (!attrs?.length) {
    return [];
  }

  const config = parsePdpCustomizationConfig(product.pdpCustomization);
  const configuredRoles = roleByValueId(config);
  const configuredValueIds =
    config && config.items.length > 0
      ? new Set(config.items.map((item) => item.valueId))
      : null;

  const rows: RawCustomizationRow[] = [];
  const seenLabels = new Set<string>();

  const useConfigOnly = configuredValueIds !== null && configuredValueIds.size > 0;

  for (const productAttr of attrs) {
    const attrKey = productAttr.attribute.key;
    if (!useConfigOnly && !isPdpCustomizationAttributeKey(attrKey)) {
      continue;
    }

    for (const value of productAttr.attribute.values) {
      const valueId = value.id?.trim() ?? '';
      const valueSlug = value.value?.trim() ?? '';
      if (!valueSlug || isExcludedCustomizationValueSlug(valueSlug)) {
        continue;
      }
      if (configuredValueIds && valueId && !configuredValueIds.has(valueId)) {
        continue;
      }

      const label = getAttributeLabel(language, attrKey, valueSlug);
      if (!label || seenLabels.has(label)) {
        continue;
      }
      seenLabels.add(label);

      rows.push({
        id: valueId || `${attrKey}:${valueSlug}`,
        label,
        valueSlug,
        attrKey,
        priceAdjustment: normalizePriceAdjustment(value.priceAdjustment),
        configuredRole: valueId ? configuredRoles.get(valueId) : undefined,
      });
    }
  }

  return rows;
}

function classifyRow(
  row: RawCustomizationRow,
  variantValueIds: Set<string>,
  variantHasCustomizationOptions: boolean,
): 'default' | 'optional' {
  if (row.configuredRole === 'default') {
    return 'default';
  }
  if (row.configuredRole === 'addon') {
    return 'optional';
  }

  if (isOptionalAttrKey(row.attrKey) || row.priceAdjustment > 0) {
    return 'optional';
  }

  if (variantValueIds.has(row.id)) {
    return 'default';
  }

  if (!variantHasCustomizationOptions && isDefaultAttrKey(row.attrKey)) {
    return 'default';
  }

  return 'optional';
}

/**
 * Split customization values: defaults for Exclude, paid/optional for Add.
 */
export function resolvePdpCustomizationOptionSets(
  product: Product | null | undefined,
  language: LanguageCode,
  currentVariant?: ProductVariant | null,
): PdpCustomizationOptionSets {
  if (!product) {
    return { defaultIncluded: [], optionalAdd: [] };
  }

  const variantValueIds = collectVariantCustomizationValueIds(currentVariant);
  const variantHasCustomizationOptions = variantValueIds.size > 0;
  const rows = buildRawRows(product, language);

  const defaultIncluded: PdpCustomizationIngredientOption[] = [];
  const optionalAdd: PdpCustomizationIngredientOption[] = [];

  for (const row of rows) {
    const option: PdpCustomizationIngredientOption = {
      id: row.id,
      label: row.label,
      valueSlug: row.valueSlug,
      attrKey: row.attrKey,
      priceAdjustment: row.priceAdjustment,
    };

    if (classifyRow(row, variantValueIds, variantHasCustomizationOptions) === 'default') {
      defaultIncluded.push(option);
    } else {
      optionalAdd.push(option);
    }
  }

  return { defaultIncluded, optionalAdd };
}

/** @deprecated Use resolvePdpCustomizationOptionSets — returns all choices merged. */
export function resolvePdpCustomizationIngredients(
  product: Product | null | undefined,
  language: LanguageCode,
): PdpCustomizationIngredientOption[] {
  const sets = resolvePdpCustomizationOptionSets(product, language);
  return [...sets.defaultIncluded, ...sets.optionalAdd];
}

function parseAdditionLabels(additions: string): string[] {
  return additions
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalAddByLabel(
  product: Product,
  language: LanguageCode,
  currentVariant?: ProductVariant | null,
): Map<string, PdpCustomizationIngredientOption> {
  const { optionalAdd } = resolvePdpCustomizationOptionSets(product, language, currentVariant);
  return new Map(optionalAdd.map((o) => [o.label, o]));
}

/** Map Add-pill labels to attribute value ids for cart / checkout price. */
export function resolveCustomizationAdditionValueIds(
  product: Product | null | undefined,
  additions: string,
  language: LanguageCode,
  currentVariant?: ProductVariant | null,
): string[] {
  if (!product || !additions.trim()) {
    return [];
  }

  const labels = parseAdditionLabels(additions);
  if (labels.length === 0) {
    return [];
  }

  const byLabel = optionalAddByLabel(product, language, currentVariant);
  const ids: string[] = [];
  for (const label of labels) {
    const id = byLabel.get(label)?.id;
    if (id && !ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

/** Sum priceAdjustment for selected Add-pill options (store currency). */
export function sumCustomizationAdditionPrice(
  product: Product | null | undefined,
  additions: string,
  language: LanguageCode,
  currentVariant?: ProductVariant | null,
): number {
  if (!product || !additions.trim()) {
    return 0;
  }

  const labels = parseAdditionLabels(additions);
  if (labels.length === 0) {
    return 0;
  }

  const byLabel = optionalAddByLabel(product, language, currentVariant);
  let sum = 0;
  for (const label of labels) {
    const option = byLabel.get(label);
    if (option) {
      sum += option.priceAdjustment;
    }
  }
  return sum;
}

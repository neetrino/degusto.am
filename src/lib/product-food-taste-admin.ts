import {
  FOOD_ATTR_GREENS_KEY,
  FOOD_ATTR_SPICY_KEY,
  isFoodTasteAttributeKey,
  productSupportsConfigurableGreens,
  productSupportsConfigurableSpicy,
} from '@/lib/product-food-attributes';

/** Categories without spicy/greens variant dimensions (mirrors seed data). */
const NO_VARIANT_PREFERENCE_CATEGORY_SLUGS = new Set([
  'juices-drinks',
  'bar-alcohol',
  'cakes-pancakes',
  'pastry',
  'bread',
  'sauces',
  'semi-finished',
]);

export type FoodTasteBadgeSelection = {
  spicy: boolean;
  greens: boolean;
};

export type FoodTasteAttributeRef = {
  id: string;
  key: string;
  values: Array<{ id: string; value: string }>;
};

type VariantOption = {
  attributeKey?: string;
  value?: string;
  valueId?: string;
};

type VariantWithOptions = {
  sku?: string;
  options?: VariantOption[];
  published?: boolean;
};

const SPICY_OFF = 'not-spicy';
const SPICY_ON = 'spicy';
const GREENS_OFF = 'without-greens';
const GREENS_ON = 'with-greens';

export function createEmptyFoodTasteBadgeSelection(): FoodTasteBadgeSelection {
  return { spicy: false, greens: false };
}

/** Attributes eligible for PDP add/exclude configuration (excludes spicy & greens). */
export function filterPdpCustomizationAttributes<T extends { key: string }>(attributes: T[]): T[] {
  return attributes.filter((attribute) => !isFoodTasteAttributeKey(attribute.key));
}

export function withoutFoodTasteAttributeIds<T extends { id: string; key: string }>(
  attributes: T[],
  ids: Set<string>,
): Set<string> {
  const excluded = new Set(
    attributes.filter((attribute) => isFoodTasteAttributeKey(attribute.key)).map((a) => a.id),
  );
  return new Set([...ids].filter((id) => !excluded.has(id)));
}

/** Food products (non-clothing) get spicy/greens icon toggles on the product form. */
export function productFormSupportsFoodTasteBadges(
  _categoryIds: string[],
  isClothingCategory: boolean,
): boolean {
  return !isClothingCategory;
}

export function categorySupportsFoodTasteBadges(
  primaryCategoryId: string | null | undefined,
  categories: Array<{ id: string; slug?: string; requiresSizes?: boolean }>,
): boolean {
  if (!primaryCategoryId) {
    return false;
  }
  const category = categories.find((item) => item.id === primaryCategoryId);
  if (!category || category.requiresSizes) {
    return false;
  }
  if (category.slug && NO_VARIANT_PREFERENCE_CATEGORY_SLUGS.has(category.slug)) {
    return false;
  }
  return true;
}

export function findFoodTasteAttribute(
  attributes: FoodTasteAttributeRef[],
  key: string,
): FoodTasteAttributeRef | undefined {
  return attributes.find((item) => item.key === key);
}

export function inferFoodTasteBadgeSelectionFromVariants(
  variants: VariantWithOptions[] | null | undefined,
): FoodTasteBadgeSelection {
  return {
    spicy: productSupportsConfigurableSpicy(variants),
    greens: productSupportsConfigurableGreens(variants),
  };
}

export function collectFoodTasteAttributeIds(
  attributes: FoodTasteAttributeRef[],
  _selection: FoodTasteBadgeSelection,
  categoryEligible: boolean,
): string[] {
  if (!categoryEligible) {
    return [];
  }
  const ids: string[] = [];
  const spicyAttr = findFoodTasteAttribute(attributes, FOOD_ATTR_SPICY_KEY);
  const greensAttr = findFoodTasteAttribute(attributes, FOOD_ATTR_GREENS_KEY);
  if (spicyAttr) {
    ids.push(spicyAttr.id);
  }
  if (greensAttr) {
    ids.push(greensAttr.id);
  }
  return ids;
}

function resolveTasteValue(
  attribute: FoodTasteAttributeRef | undefined,
  slug: string,
): VariantOption | null {
  if (!attribute) {
    return null;
  }
  const match = attribute.values.find((item) => item.value === slug);
  if (!match) {
    return null;
  }
  return {
    attributeKey: attribute.key,
    value: match.value,
    valueId: match.id,
  };
}

function buildTasteChoiceGroups(
  spicyAttr: FoodTasteAttributeRef | undefined,
  greensAttr: FoodTasteAttributeRef | undefined,
  selection: FoodTasteBadgeSelection,
): VariantOption[][] {
  const spicyChoices: VariantOption[] = selection.spicy
    ? ([
        resolveTasteValue(spicyAttr, SPICY_ON),
        resolveTasteValue(spicyAttr, SPICY_OFF),
      ].filter(Boolean) as VariantOption[])
    : ([resolveTasteValue(spicyAttr, SPICY_OFF)].filter(Boolean) as VariantOption[]);

  const greensChoices: VariantOption[] = selection.greens
    ? ([
        resolveTasteValue(greensAttr, GREENS_ON),
        resolveTasteValue(greensAttr, GREENS_OFF),
      ].filter(Boolean) as VariantOption[])
    : ([resolveTasteValue(greensAttr, GREENS_OFF)].filter(Boolean) as VariantOption[]);

  const groups: VariantOption[][] = [];
  if (spicyChoices.length > 0) {
    groups.push(spicyChoices);
  }
  if (greensChoices.length > 0) {
    groups.push(greensChoices);
  }
  return groups;
}

function cartesianOptionGroups(groups: VariantOption[][]): VariantOption[][] {
  if (groups.length === 0) {
    return [[]];
  }
  if (groups.length === 1) {
    return groups[0].map((option) => [option]);
  }
  const [first, ...rest] = groups;
  const restCombos = cartesianOptionGroups(rest);
  const result: VariantOption[][] = [];
  for (const option of first) {
    for (const combo of restCombos) {
      result.push([option, ...combo]);
    }
  }
  return result;
}

function stripFoodTasteOptions(options: VariantOption[]): VariantOption[] {
  return options.filter(
    (option) =>
      option.attributeKey !== FOOD_ATTR_SPICY_KEY && option.attributeKey !== FOOD_ATTR_GREENS_KEY,
  );
}

function buildTasteSkuSuffix(tasteOptions: VariantOption[]): string {
  const parts = tasteOptions
    .map((option) => option.value?.trim())
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toUpperCase().replace(/\s+/g, '-'));
  return parts.length > 0 ? `-${parts.join('-')}` : '';
}

/**
 * Expands each variant with spicy/greens option combinations based on admin icon toggles.
 */
export function expandVariantsWithFoodTasteOptions<T extends VariantWithOptions>(
  variants: T[],
  selection: FoodTasteBadgeSelection,
  attributes: FoodTasteAttributeRef[],
): T[] {
  const spicyAttr = findFoodTasteAttribute(attributes, FOOD_ATTR_SPICY_KEY);
  const greensAttr = findFoodTasteAttribute(attributes, FOOD_ATTR_GREENS_KEY);
  if (!spicyAttr && !greensAttr) {
    return variants;
  }

  const tasteGroups = buildTasteChoiceGroups(spicyAttr, greensAttr, selection);
  if (tasteGroups.length === 0) {
    return variants;
  }

  const tasteCombinations = cartesianOptionGroups(tasteGroups);
  const expanded: T[] = [];

  for (const variant of variants) {
    const baseOptions = stripFoodTasteOptions(variant.options ?? []);
    const baseSku = variant.sku?.trim() ?? '';

    for (const tasteOptions of tasteCombinations) {
      const mergedOptions = [...baseOptions, ...tasteOptions];
      const suffix = buildTasteSkuSuffix(tasteOptions);
      const needsSkuSuffix = tasteCombinations.length > 1 && suffix.length > 0;
      expanded.push({
        ...variant,
        sku: needsSkuSuffix && baseSku ? `${baseSku}${suffix}` : variant.sku,
        options: mergedOptions.length > 0 ? mergedOptions : undefined,
      });
    }
  }

  return expanded.length > 0 ? expanded : variants;
}

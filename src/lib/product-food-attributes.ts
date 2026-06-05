import type { Prisma } from '@prisma/client';

/** Product `Attribute.key` for spicy level (seed / admin). */
export const FOOD_ATTR_SPICY_KEY = 'spicy';

/** Product `Attribute.key` for greens (seed / admin). */
export const FOOD_ATTR_GREENS_KEY = 'greens';

/** Spicy / greens are configured via admin taste badges, not PDP customization attributes. */
export function isFoodTasteAttributeKey(attrKey: string): boolean {
  const normalized = attrKey.toLowerCase().trim();
  return normalized === FOOD_ATTR_SPICY_KEY || normalized === FOOD_ATTR_GREENS_KEY;
}

type VariantOptionPick = {
  attributeKey?: string | null;
  value?: string | null;
  valueId?: string | null;
  attributeValue?: {
    value: string;
    attribute?: { key?: string | null } | null;
  } | null;
};

type VariantPick = {
  published?: boolean | null;
  options?: VariantOptionPick[] | null;
  /** Prisma `ProductVariant.attributes` JSON (seed writes spicy/greens slugs here). */
  attributes?: unknown;
};

function addBucketsFromVariantAttributesJson(
  variants: VariantPick[],
  attrKey: string,
  buckets: Set<string>
): void {
  for (const variant of variants) {
    if (variant.published === false) {
      continue;
    }
    const raw = variant.attributes;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      continue;
    }
    const slot = (raw as Record<string, unknown>)[attrKey];
    if (!Array.isArray(slot)) {
      continue;
    }
    for (const entry of slot) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      const rec = entry as { value?: unknown; valueId?: unknown };
      if (typeof rec.value === 'string' && rec.value.trim()) {
        buckets.add(`v:${rec.value.trim()}`);
      } else if (typeof rec.valueId === 'string' && rec.valueId.trim()) {
        buckets.add(`id:${rec.valueId.trim()}`);
      }
    }
  }
}

function optionAttributeKey(opt: VariantOptionPick): string {
  const fromRelation = opt.attributeValue?.attribute?.key;
  if (typeof fromRelation === 'string' && fromRelation.trim()) {
    return fromRelation.trim();
  }
  if (typeof opt.attributeKey === 'string' && opt.attributeKey.trim()) {
    return opt.attributeKey.trim();
  }
  return '';
}

/** Stable bucket for counting distinct choices (prefers slug on AttributeValue). */
function optionChoiceBucket(opt: VariantOptionPick): string {
  const slug = opt.attributeValue?.value;
  if (typeof slug === 'string' && slug.trim()) {
    return `v:${slug.trim()}`;
  }
  if (typeof opt.valueId === 'string' && opt.valueId.trim()) {
    return `id:${opt.valueId.trim()}`;
  }
  if (typeof opt.value === 'string' && opt.value.trim()) {
    return `s:${opt.value.trim().toLowerCase()}`;
  }
  return '';
}

function distinctChoiceCountForKey(variants: VariantPick[] | null | undefined, attrKey: string): number {
  if (!variants?.length) {
    return 0;
  }
  const buckets = new Set<string>();
  for (const variant of variants) {
    if (variant.published === false) {
      continue;
    }
    for (const opt of variant.options ?? []) {
      if (optionAttributeKey(opt) !== attrKey) {
        continue;
      }
      const bucket = optionChoiceBucket(opt);
      if (bucket) {
        buckets.add(bucket);
      }
    }
  }
  addBucketsFromVariantAttributesJson(variants, attrKey, buckets);
  return buckets.size;
}

/**
 * True when the product offers a real choice for spicy (not a single fixed level).
 * Uses published variants only.
 */
export function productSupportsConfigurableSpicy(variants: VariantPick[] | null | undefined): boolean {
  return distinctChoiceCountForKey(variants, FOOD_ATTR_SPICY_KEY) >= 2;
}

/**
 * True when the product offers a real choice for greens.
 */
export function productSupportsConfigurableGreens(variants: VariantPick[] | null | undefined): boolean {
  return distinctChoiceCountForKey(variants, FOOD_ATTR_GREENS_KEY) >= 2;
}

export function resolveFoodAttributeFlagsFromVariants(
  variants: VariantPick[] | null | undefined
): { supportsSpicy: boolean; supportsGreens: boolean } {
  return {
    supportsSpicy: productSupportsConfigurableSpicy(variants),
    supportsGreens: productSupportsConfigurableGreens(variants),
  };
}

/**
 * Prisma fragment: products where customers can pick both spicy and non-spicy variants,
 * or both greens modes (same rule as PDP selectors).
 */
export function buildProductWhereTasteCapability(taste: 'leaf' | 'pepper' | null): Prisma.ProductWhereInput {
  if (taste === 'pepper') {
    return {
      AND: [
        {
          variants: {
            some: {
              published: true,
              options: {
                some: {
                  attributeValue: {
                    attribute: { key: FOOD_ATTR_SPICY_KEY },
                    value: 'spicy',
                  },
                },
              },
            },
          },
        },
        {
          variants: {
            some: {
              published: true,
              options: {
                some: {
                  attributeValue: {
                    attribute: { key: FOOD_ATTR_SPICY_KEY },
                    value: 'not-spicy',
                  },
                },
              },
            },
          },
        },
      ],
    };
  }

  if (taste === 'leaf') {
    return {
      AND: [
        {
          variants: {
            some: {
              published: true,
              options: {
                some: {
                  attributeValue: {
                    attribute: { key: FOOD_ATTR_GREENS_KEY },
                    value: 'with-greens',
                  },
                },
              },
            },
          },
        },
        {
          variants: {
            some: {
              published: true,
              options: {
                some: {
                  attributeValue: {
                    attribute: { key: FOOD_ATTR_GREENS_KEY },
                    value: 'without-greens',
                  },
                },
              },
            },
          },
        },
      ],
    };
  }

  return {};
}

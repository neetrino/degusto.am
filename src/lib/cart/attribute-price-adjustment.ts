import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";
import type { ProductCustomizations } from "./customizations";
import { resolveAdditionValueIdsByLabelsBatch } from "./customization-addition-price";

const MAX_SELECTED_VALUE_IDS = 24;

type VariantPricingRow = {
  id: string;
  options: Array<{ valueId: string | null }>;
  product: {
    attributeIds: string[];
    productAttributes: Array<{ attributeId: string }>;
  };
};

type AttributeValueCandidate = {
  id: string;
  attributeId: string;
  priceAdjustment: unknown;
};

export type CartLineCustomizationPricingInput = {
  lineKey: string;
  variantId: string;
  customizations?: ProductCustomizations;
};

function productAttributeIdsForVariant(variant: VariantPricingRow): string[] {
  return [
    ...new Set([
      ...(variant.product.attributeIds ?? []),
      ...variant.product.productAttributes.map((row) => row.attributeId),
    ]),
  ];
}

function mergeSelectedCustomizationValueIds(
  customizations: ProductCustomizations | undefined,
  additionValueIds: string[]
): string[] {
  const merged = new Set<string>();
  for (const id of customizations?.selectedAttributeValueIds ?? []) {
    const trimmed = id.trim();
    if (trimmed) {
      merged.add(trimmed);
    }
  }
  for (const id of additionValueIds) {
    merged.add(id);
  }
  return [...merged].slice(0, MAX_SELECTED_VALUE_IDS);
}

function resolveValueIdsForVariantAdjustment(
  variant: VariantPricingRow,
  requested: string[],
  candidateById: Map<string, AttributeValueCandidate>
): string[] {
  const optionValueIds = new Set<string>();
  for (const opt of variant.options ?? []) {
    if (typeof opt.valueId === "string" && opt.valueId.trim()) {
      optionValueIds.add(opt.valueId.trim());
    }
  }

  const strict = requested.filter((valueId) => optionValueIds.has(valueId));
  const productAttributeIds = new Set<string>(variant.product.attributeIds ?? []);

  if (strict.length > 0) {
    return strict;
  }

  const fallbackByProductAttributes = requested.filter((valueId) => {
    const row = candidateById.get(valueId);
    return Boolean(row && productAttributeIds.has(row.attributeId));
  });
  if (fallbackByProductAttributes.length > 0) {
    return fallbackByProductAttributes;
  }

  return requested.filter((valueId) => candidateById.has(valueId));
}

function sumCandidateAdjustments(
  valueIds: string[],
  candidateById: Map<string, AttributeValueCandidate>
): number {
  let sum = 0;
  for (const valueId of valueIds) {
    const row = candidateById.get(valueId);
    if (row) {
      sum += Number(row.priceAdjustment) || 0;
    }
  }
  return sum;
}

/**
 * Sum `priceAdjustment` for attribute values selected for this variant.
 * Prefers ids listed on `ProductVariantOption.valueId`; if none match, falls back to
 * values whose `attributeId` is in the product's `attributeIds` (food-style PDP).
 */
export async function sumVerifiedAttributePriceAdjustment(
  variantId: string,
  requestedValueIds: string[] | undefined
): Promise<number> {
  if (!requestedValueIds || requestedValueIds.length === 0) {
    return 0;
  }

  const unique = [...new Set(requestedValueIds.map((id) => id.trim()).filter(Boolean))].slice(
    0,
    MAX_SELECTED_VALUE_IDS
  );
  if (unique.length === 0) {
    return 0;
  }

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
      options: { select: { valueId: true } },
      product: { select: { attributeIds: true, productAttributes: { select: { attributeId: true } } } },
    },
  });

  if (!variant) {
    return 0;
  }

  const candidateRows = await db.attributeValue.findMany({
    where: { id: { in: unique } },
    select: { id: true, attributeId: true, priceAdjustment: true },
  });
  const candidateById = new Map(candidateRows.map((row) => [row.id, row] as const));
  const idsForSum = resolveValueIdsForVariantAdjustment(variant, unique, candidateById);

  if (idsForSum.length === 0 && unique.length > 0) {
    logger.debug("[cart] Attribute price adjustment: no verified ids", {
      variantId,
      requested: unique,
    });
  }

  return sumCandidateAdjustments(idsForSum, candidateById);
}

/** Attribute + Add-pill price adjustments for a cart line (exclusions do not apply). */
export async function sumLineCustomizationPriceAdjustment(
  variantId: string,
  customizations?: ProductCustomizations
): Promise<number> {
  const adjustmentByLineKey = await sumLineCustomizationPriceAdjustmentsForLines([
    { lineKey: variantId, variantId, customizations },
  ]);
  return adjustmentByLineKey.get(variantId) ?? 0;
}

/**
 * Batched customization price adjustments keyed by cart line (supports duplicate variants).
 */
export async function sumLineCustomizationPriceAdjustmentsForLines(
  lines: CartLineCustomizationPricingInput[]
): Promise<Map<string, number>> {
  if (lines.length === 0) {
    return new Map();
  }

  const uniqueVariantIds = [...new Set(lines.map((line) => line.variantId.trim()).filter(Boolean))];
  if (uniqueVariantIds.length === 0) {
    return new Map(lines.map((line) => [line.lineKey, 0]));
  }

  const variants = await db.productVariant.findMany({
    where: { id: { in: uniqueVariantIds } },
    select: {
      id: true,
      options: { select: { valueId: true } },
      product: {
        select: {
          attributeIds: true,
          productAttributes: { select: { attributeId: true } },
        },
      },
    },
  });
  const variantById = new Map(variants.map((variant) => [variant.id, variant] as const));

  const labelRequests = lines.map((line) => {
    const variant = variantById.get(line.variantId);
    return {
      requestKey: line.lineKey,
      additions: line.customizations?.additions,
      productAttributeIds: variant ? productAttributeIdsForVariant(variant) : undefined,
    };
  });
  const additionIdsByLineKey = await resolveAdditionValueIdsByLabelsBatch(labelRequests);

  const resolvedValueIdsByLineKey = new Map<string, string[]>();
  const allCandidateValueIds = new Set<string>();

  for (const line of lines) {
    const additionIds = additionIdsByLineKey.get(line.lineKey) ?? [];
    const merged = mergeSelectedCustomizationValueIds(line.customizations, additionIds);
    resolvedValueIdsByLineKey.set(line.lineKey, merged);
    for (const valueId of merged) {
      allCandidateValueIds.add(valueId);
    }
  }

  if (allCandidateValueIds.size === 0) {
    return new Map(lines.map((line) => [line.lineKey, 0]));
  }

  const candidateRows = await db.attributeValue.findMany({
    where: { id: { in: [...allCandidateValueIds] } },
    select: { id: true, attributeId: true, priceAdjustment: true },
  });
  const candidateById = new Map(candidateRows.map((row) => [row.id, row] as const));

  const adjustmentByLineKey = new Map<string, number>();
  for (const line of lines) {
    const variant = variantById.get(line.variantId);
    const requested = resolvedValueIdsByLineKey.get(line.lineKey) ?? [];
    if (!variant || requested.length === 0) {
      adjustmentByLineKey.set(line.lineKey, 0);
      continue;
    }

    const idsForSum = resolveValueIdsForVariantAdjustment(variant, requested, candidateById);
    adjustmentByLineKey.set(line.lineKey, sumCandidateAdjustments(idsForSum, candidateById));
  }

  return adjustmentByLineKey;
}

/**
 * Batched customization price adjustments by variant id.
 * @deprecated Prefer {@link sumLineCustomizationPriceAdjustmentsForLines} when lines can share a variant.
 */
export async function sumLineCustomizationPriceAdjustmentsByVariant(
  variantIds: string[],
  customizationsByVariantId?: Map<string, ProductCustomizations | undefined>
): Promise<Map<string, number>> {
  const uniqueVariantIds = [...new Set(variantIds.map((id) => id.trim()).filter(Boolean))];
  const lines = uniqueVariantIds.map((variantId) => ({
    lineKey: variantId,
    variantId,
    customizations: customizationsByVariantId?.get(variantId),
  }));
  return sumLineCustomizationPriceAdjustmentsForLines(lines);
}

import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";
import type { ProductCustomizations } from "./customizations";
import { mergeCustomizationValueIdsForPricing } from "./customization-addition-price";

const MAX_SELECTED_VALUE_IDS = 24;

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
      options: { select: { valueId: true } },
      product: { select: { attributeIds: true } },
    },
  });

  if (!variant) {
    return 0;
  }

  const allowedFromOptions = new Set<string>();
  for (const opt of variant.options ?? []) {
    if (typeof opt.valueId === "string" && opt.valueId.trim()) {
      allowedFromOptions.add(opt.valueId.trim());
    }
  }

  const strictIds = unique.filter((id) => allowedFromOptions.has(id));

  let idsForSum: string[];
  if (strictIds.length > 0) {
    idsForSum = strictIds;
  } else if (unique.length > 0 && (variant.product.attributeIds?.length ?? 0) > 0) {
    const fallbackRows = await db.attributeValue.findMany({
      where: {
        id: { in: unique },
        attributeId: { in: variant.product.attributeIds },
      },
      select: { id: true },
    });
    idsForSum = fallbackRows.map((r) => r.id);
    if (idsForSum.length !== unique.length) {
      logger.debug("[cart] Attribute price adjustment: used product.attributeIds fallback", {
        variantId,
        requested: unique,
        resolved: idsForSum,
      });
    }
  } else {
    idsForSum = [];
  }

  if (idsForSum.length === 0 && unique.length > 0) {
    const directRows = await db.attributeValue.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    idsForSum = directRows.map((row) => row.id);
  }

  if (idsForSum.length === 0) {
    return 0;
  }

  const rows = await db.attributeValue.findMany({
    where: { id: { in: idsForSum } },
    select: { priceAdjustment: true },
  });

  return rows.reduce((sum, row) => sum + (Number(row.priceAdjustment) || 0), 0);
}

/** Attribute + Add-pill price adjustments for a cart line (exclusions do not apply). */
export async function sumLineCustomizationPriceAdjustment(
  variantId: string,
  customizations?: ProductCustomizations
): Promise<number> {
  const adjustmentByVariantId = await sumLineCustomizationPriceAdjustmentsByVariant(
    [variantId],
    customizations ? new Map([[variantId, customizations]]) : undefined
  );
  return adjustmentByVariantId.get(variantId) ?? 0;
}

/**
 * Batched customization price adjustments by variant id.
 */
export async function sumLineCustomizationPriceAdjustmentsByVariant(
  variantIds: string[],
  customizationsByVariantId?: Map<string, ProductCustomizations | undefined>
): Promise<Map<string, number>> {
  const uniqueVariantIds = [...new Set(variantIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueVariantIds.length === 0) {
    return new Map();
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
  const resolvedValueIdsByVariant = new Map<string, string[]>();
  const allCandidateValueIds = new Set<string>();

  for (const id of uniqueVariantIds) {
    const variant = variantById.get(id);
    if (!variant) {
      resolvedValueIdsByVariant.set(id, []);
      continue;
    }
    const productAttributeIds = [
      ...new Set([
        ...(variant.product.attributeIds ?? []),
        ...variant.product.productAttributes.map((row) => row.attributeId),
      ]),
    ];
    const merged = await mergeCustomizationValueIdsForPricing(
      customizationsByVariantId?.get(id),
      productAttributeIds.length > 0 ? productAttributeIds : undefined
    );
    const uniqueMerged = [...new Set((merged ?? []).map((valueId) => valueId.trim()).filter(Boolean))].slice(
      0,
      MAX_SELECTED_VALUE_IDS
    );
    resolvedValueIdsByVariant.set(id, uniqueMerged);
    for (const valueId of uniqueMerged) {
      allCandidateValueIds.add(valueId);
    }
  }

  if (allCandidateValueIds.size === 0) {
    return new Map(uniqueVariantIds.map((id) => [id, 0]));
  }

  const candidateRows = await db.attributeValue.findMany({
    where: { id: { in: [...allCandidateValueIds] } },
    select: { id: true, attributeId: true, priceAdjustment: true },
  });
  const candidateById = new Map(candidateRows.map((row) => [row.id, row] as const));

  const adjustmentByVariant = new Map<string, number>();
  for (const id of uniqueVariantIds) {
    const variant = variantById.get(id);
    const requested = resolvedValueIdsByVariant.get(id) ?? [];
    if (!variant || requested.length === 0) {
      adjustmentByVariant.set(id, 0);
      continue;
    }

    const optionValueIds = new Set<string>();
    for (const opt of variant.options ?? []) {
      if (typeof opt.valueId === "string" && opt.valueId.trim()) {
        optionValueIds.add(opt.valueId.trim());
      }
    }

    const strict = requested.filter((valueId) => optionValueIds.has(valueId));
    const productAttributeIds = new Set<string>(variant.product.attributeIds ?? []);

    let idsForSum = strict;
    if (idsForSum.length === 0) {
      idsForSum = requested.filter((valueId) => {
        const row = candidateById.get(valueId);
        return Boolean(row && productAttributeIds.has(row.attributeId));
      });
    }
    if (idsForSum.length === 0) {
      idsForSum = requested.filter((valueId) => candidateById.has(valueId));
    }

    let sum = 0;
    for (const valueId of idsForSum) {
      const row = candidateById.get(valueId);
      if (row) {
        sum += Number(row.priceAdjustment) || 0;
      }
    }
    adjustmentByVariant.set(id, sum);
  }

  return adjustmentByVariant;
}

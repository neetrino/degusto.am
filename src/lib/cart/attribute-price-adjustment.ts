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
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { product: { select: { attributeIds: true } } },
  });
  if (!variant) {
    return 0;
  }
  const merged = await mergeCustomizationValueIdsForPricing(
    customizations,
    variant.product.attributeIds ?? undefined
  );
  return sumVerifiedAttributePriceAdjustment(variantId, merged);
}

import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";

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

  // This branch's Prisma schema has no `AttributeValue.priceAdjustment`; keep id verification above.
  logger.debug('[cart] Attribute price adjustment not persisted on this schema', {
    variantId,
    idsForSum,
  });
  return 0;
}

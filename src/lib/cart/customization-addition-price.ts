import { db } from "@white-shop/db";
import { normalizePriceAdjustment } from "@/lib/attributes/price-adjustment";
import type { ProductCustomizations } from "./customizations";

const MAX_LABELS = 32;

/**
 * Resolve attribute value ids from Add-pill labels (any locale translation match).
 */
export async function resolveAdditionValueIdsByLabels(
  additions: string | undefined,
  productAttributeIds: string[] | undefined
): Promise<string[]> {
  const labels = (additions ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_LABELS);
  if (labels.length === 0 || !productAttributeIds?.length) {
    return [];
  }

  const rows = await db.attributeValue.findMany({
    where: {
      attributeId: { in: productAttributeIds },
      translations: {
        some: {
          label: { in: labels },
        },
      },
    },
    select: { id: true },
  });

  return rows.map((r) => r.id);
}

/** Merge PDP attribute ids with Add-pill labels for a single price-adjustment pass. */
export async function mergeCustomizationValueIdsForPricing(
  customizations: ProductCustomizations | undefined,
  productAttributeIds: string[] | undefined
): Promise<string[]> {
  const merged = new Set<string>();
  for (const id of customizations?.selectedAttributeValueIds ?? []) {
    const trimmed = id.trim();
    if (trimmed) {
      merged.add(trimmed);
    }
  }
  const fromLabels = await resolveAdditionValueIdsByLabels(
    customizations?.additions,
    productAttributeIds
  );
  for (const id of fromLabels) {
    merged.add(id);
  }
  return [...merged];
}

/**
 * @deprecated Prefer mergeCustomizationValueIdsForPricing + sumVerifiedAttributePriceAdjustment.
 */
export async function sumCustomizationAdditionPriceByLabels(
  additions: string | undefined,
  productAttributeIds: string[] | undefined
): Promise<number> {
  const ids = await resolveAdditionValueIdsByLabels(additions, productAttributeIds);
  if (ids.length === 0) {
    return 0;
  }

  const rows = await db.attributeValue.findMany({
    where: { id: { in: ids } },
    select: { priceAdjustment: true },
  });

  return rows.reduce(
    (sum, row) => sum + normalizePriceAdjustment(row.priceAdjustment),
    0
  );
}

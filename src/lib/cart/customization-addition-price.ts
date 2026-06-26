import { db } from "@white-shop/db";
import { normalizePriceAdjustment } from "@/lib/attributes/price-adjustment";
import type { ProductCustomizations } from "./customizations";
import { parseAdditionLabels } from "./parse-addition-labels";

export { parseAdditionLabels } from "./parse-addition-labels";

export type AdditionLabelResolveRequest = {
  requestKey: string;
  additions?: string;
  productAttributeIds?: string[];
};

/**
 * Resolve attribute value ids from Add-pill labels (any locale translation match).
 */
export async function resolveAdditionValueIdsByLabels(
  additions: string | undefined,
  productAttributeIds: string[] | undefined
): Promise<string[]> {
  const resolved = await resolveAdditionValueIdsByLabelsBatch([
    { requestKey: "single", additions, productAttributeIds },
  ]);
  return resolved.get("single") ?? [];
}

/** One query for all cart lines that need Add-pill label → attribute value id resolution. */
export async function resolveAdditionValueIdsByLabelsBatch(
  requests: AdditionLabelResolveRequest[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  const labelsByKey = new Map<string, string[]>();
  const allLabels = new Set<string>();
  const allAttributeIds = new Set<string>();

  for (const request of requests) {
    const labels = parseAdditionLabels(request.additions);
    labelsByKey.set(request.requestKey, labels);
    if (labels.length === 0 || !request.productAttributeIds?.length) {
      result.set(request.requestKey, []);
      continue;
    }
    for (const label of labels) {
      allLabels.add(label);
    }
    for (const attributeId of request.productAttributeIds) {
      allAttributeIds.add(attributeId);
    }
  }

  if (allLabels.size === 0 || allAttributeIds.size === 0) {
    for (const request of requests) {
      if (!result.has(request.requestKey)) {
        result.set(request.requestKey, []);
      }
    }
    return result;
  }

  const rows = await db.attributeValue.findMany({
    where: {
      attributeId: { in: [...allAttributeIds] },
      translations: {
        some: {
          label: { in: [...allLabels] },
        },
      },
    },
    select: {
      id: true,
      attributeId: true,
      translations: { select: { label: true } },
    },
  });

  for (const request of requests) {
    if (result.has(request.requestKey)) {
      continue;
    }

    const labels = labelsByKey.get(request.requestKey) ?? [];
    const labelSet = new Set(labels);
    const attributeIds = new Set(request.productAttributeIds ?? []);
    const matchedIds: string[] = [];

    for (const row of rows) {
      if (!attributeIds.has(row.attributeId)) {
        continue;
      }
      const labelMatch = row.translations.some((translation) =>
        labelSet.has(translation.label.trim())
      );
      if (labelMatch) {
        matchedIds.push(row.id);
      }
    }

    result.set(request.requestKey, matchedIds);
  }

  return result;
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

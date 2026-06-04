export type AttributeValuePriceRow = {
  id: string;
  priceAdjustment?: number | null;
};

export type AttributePriceCatalog = {
  values: AttributeValuePriceRow[];
};

export function normalizePriceAdjustment(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

/** Sum price adjustments for the given attribute value ids across all attributes. */
export function sumAttributeValuePriceAdjustments(
  attributes: AttributePriceCatalog[],
  valueIds: string[]
): number {
  if (valueIds.length === 0) {
    return 0;
  }
  const idSet = new Set(valueIds);
  let sum = 0;
  for (const attr of attributes) {
    for (const val of attr.values) {
      if (idSet.has(val.id)) {
        sum += normalizePriceAdjustment(val.priceAdjustment);
      }
    }
  }
  return sum;
}

export type AttributeGroupPriceEntry = {
  valueId?: string;
  value?: string;
  label?: string;
  priceAdjustment?: number;
};

export function findGroupPriceAdjustment(
  group: AttributeGroupPriceEntry[],
  raw: string
): number {
  if (!raw) {
    return 0;
  }
  const normalized = raw.toLowerCase().trim();
  const entry = group.find(
    (g) =>
      (g.valueId !== undefined && g.valueId !== '' && g.valueId === raw) ||
      g.value?.toLowerCase().trim() === normalized ||
      g.label?.toLowerCase().trim() === normalized
  );
  return normalizePriceAdjustment(entry?.priceAdjustment);
}

/**
 * Keep manual base price stable when attribute selections change:
 * newTotal = (currentTotal - oldAdjustments) + newAdjustments.
 */
export function recomputeVariantPriceWithAdjustments(
  currentPriceStr: string,
  previousValueIds: string[],
  newValueIds: string[],
  attributes: AttributePriceCatalog[]
): string {
  const parsed = Number.parseFloat(String(currentPriceStr).replace(',', '.'));
  const current = Number.isFinite(parsed) ? parsed : 0;
  const oldAdj = sumAttributeValuePriceAdjustments(attributes, previousValueIds);
  const base = current - oldAdj;
  const newAdj = sumAttributeValuePriceAdjustments(attributes, newValueIds);
  const total = base + newAdj;
  if (!Number.isFinite(total)) {
    return '0';
  }
  const rounded = Math.round(total * 100) / 100;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2);
}

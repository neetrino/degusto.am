/**
 * Find attribute value by multiple matching strategies
 * Tries by valueId first (most reliable), then by value, then by label
 */
export function findAttributeValue(
  attributeValues: unknown[] | undefined,
  valueId: string | undefined,
  value: string,
  label: string
): { imageUrl?: string | null; colors?: string[] | null; priceAdjustment?: number } | null {
  if (!attributeValues) return null;

  type ValRow = {
    id?: string;
    value?: string;
    label?: string;
    imageUrl?: string | null;
    colors?: string[] | null;
    priceAdjustment?: number | null;
  };

  let attrValue: { imageUrl?: string | null; colors?: string[] | null; priceAdjustment?: number } | null = null;

  if (valueId) {
    const found = (attributeValues as ValRow[]).find((v) => v.id === valueId);
    if (found) {
      attrValue = {
        imageUrl: found.imageUrl ?? null,
        colors: found.colors ?? null,
        priceAdjustment:
          typeof found.priceAdjustment === "number" && Number.isFinite(found.priceAdjustment)
            ? found.priceAdjustment
            : 0,
      };
    }
  }

  if (!attrValue) {
    const found = (attributeValues as ValRow[]).find(
      (v) => v.value?.toLowerCase() === value?.toLowerCase() || v.value === value
    );
    if (found) {
      attrValue = {
        imageUrl: found.imageUrl ?? null,
        colors: found.colors ?? null,
        priceAdjustment:
          typeof found.priceAdjustment === "number" && Number.isFinite(found.priceAdjustment)
            ? found.priceAdjustment
            : 0,
      };
    }
  }

  if (!attrValue) {
    const found = (attributeValues as ValRow[]).find(
      (v) => v.label?.toLowerCase() === label?.toLowerCase() || v.label === label
    );
    if (found) {
      attrValue = {
        imageUrl: found.imageUrl ?? null,
        colors: found.colors ?? null,
        priceAdjustment:
          typeof found.priceAdjustment === "number" && Number.isFinite(found.priceAdjustment)
            ? found.priceAdjustment
            : 0,
      };
    }
  }

  return attrValue;
}

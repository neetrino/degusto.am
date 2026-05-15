export interface ProductCustomizations {
  additions?: string;
  exclusions?: string;
  /** Attribute value ids selected on PDP (food-style extras); used for line identity + pricing hooks. */
  selectedAttributeValueIds?: string[];
}

/** Max length for free-text additions / exclusions (aligned with cart normalization). */
export const PRODUCT_CUSTOMIZATION_TEXT_MAX_LENGTH = 200;

const MAX_SELECTED_ATTRIBUTE_VALUE_IDS = 24;

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, PRODUCT_CUSTOMIZATION_TEXT_MAX_LENGTH);
}

function normalizeSelectedAttributeValueIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const ids = value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.trim())
    .filter(Boolean);
  const unique = [...new Set(ids)];
  if (unique.length === 0) {
    return undefined;
  }
  return unique.slice(0, MAX_SELECTED_ATTRIBUTE_VALUE_IDS);
}

export function normalizeProductCustomizations(input: unknown): ProductCustomizations | undefined {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const candidate = input as Record<string, unknown>;
  const additions = normalizeText(candidate.additions);
  const exclusions = normalizeText(candidate.exclusions);
  const selectedAttributeValueIds = normalizeSelectedAttributeValueIds(
    candidate.selectedAttributeValueIds,
  );

  if (!additions && !exclusions && !selectedAttributeValueIds) {
    return undefined;
  }

  return {
    ...(additions ? { additions } : {}),
    ...(exclusions ? { exclusions } : {}),
    ...(selectedAttributeValueIds ? { selectedAttributeValueIds } : {}),
  };
}

export function serializeProductCustomizations(customizations?: ProductCustomizations): string {
  if (!customizations) {
    return "";
  }
  const additions = customizations.additions ?? "";
  const exclusions = customizations.exclusions ?? "";
  const valueIds = customizations.selectedAttributeValueIds ?? [];
  const ids = valueIds.length > 0 ? [...valueIds].sort().join(",") : "";
  return `a:${additions}|e:${exclusions}|v:${ids}`;
}

export function buildCustomizationLineKey(
  variantId: string,
  customizations?: ProductCustomizations
): string {
  return `${variantId}::${serializeProductCustomizations(customizations)}`;
}

export function formatCustomizationsForVariantTitle(customizations?: ProductCustomizations): string {
  if (!customizations) {
    return "";
  }
  const parts: string[] = [];
  if (customizations.additions) {
    parts.push(`Add: ${customizations.additions}`);
  }
  if (customizations.exclusions) {
    parts.push(`Exclude: ${customizations.exclusions}`);
  }
  return parts.join(" | ");
}

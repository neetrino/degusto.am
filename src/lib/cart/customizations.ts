export interface ProductCustomizations {
  additions?: string;
  exclusions?: string;
  /** Attribute value IDs with optional extra charge (amounts verified server-side). */
  selectedAttributeValueIds?: string[];
}

const CUSTOMIZATION_MAX_LENGTH = 200;
const MAX_SELECTED_ATTRIBUTE_VALUE_IDS = 24;

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, CUSTOMIZATION_MAX_LENGTH);
}

function normalizeAttributeValueIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const ids = value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, MAX_SELECTED_ATTRIBUTE_VALUE_IDS);
  const unique = [...new Set(ids)];
  return unique.length > 0 ? unique : undefined;
}

export function normalizeProductCustomizations(input: unknown): ProductCustomizations | undefined {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const candidate = input as Record<string, unknown>;
  const additions = normalizeText(candidate.additions);
  const exclusions = normalizeText(candidate.exclusions);
  const selectedAttributeValueIds = normalizeAttributeValueIds(candidate.selectedAttributeValueIds);

  if (!additions && !exclusions && !selectedAttributeValueIds?.length) {
    return undefined;
  }

  return {
    ...(additions ? { additions } : {}),
    ...(exclusions ? { exclusions } : {}),
    ...(selectedAttributeValueIds?.length ? { selectedAttributeValueIds } : {}),
  };
}

export function serializeProductCustomizations(customizations?: ProductCustomizations): string {
  if (!customizations) {
    return "";
  }
  const additions = customizations.additions ?? "";
  const exclusions = customizations.exclusions ?? "";
  const ids = (customizations.selectedAttributeValueIds ?? []).slice().sort().join(",");
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

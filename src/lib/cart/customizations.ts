export interface ProductCustomizations {
  additions?: string;
  exclusions?: string;
}

const CUSTOMIZATION_MAX_LENGTH = 200;

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

export function normalizeProductCustomizations(input: unknown): ProductCustomizations | undefined {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const candidate = input as Record<string, unknown>;
  const additions = normalizeText(candidate.additions);
  const exclusions = normalizeText(candidate.exclusions);

  if (!additions && !exclusions) {
    return undefined;
  }

  return {
    ...(additions ? { additions } : {}),
    ...(exclusions ? { exclusions } : {}),
  };
}

export function serializeProductCustomizations(customizations?: ProductCustomizations): string {
  if (!customizations) {
    return "";
  }
  const additions = customizations.additions ?? "";
  const exclusions = customizations.exclusions ?? "";
  return `a:${additions}|e:${exclusions}`;
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

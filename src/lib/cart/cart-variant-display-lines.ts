/**
 * Variant option rows for cart UI (attribute key + human-readable value).
 */

export interface CartVariantDisplayLine {
  attributeKey: string;
  valueLabel: string;
}

function pickLocaleRow<T extends { locale: string }>(
  rows: T[] | undefined,
  locale: string
): T | undefined {
  if (!Array.isArray(rows) || rows.length === 0) {
    return undefined;
  }
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "en") ?? rows[0];
}

type PrismaCartVariantOption = {
  attributeKey: string | null;
  value: string | null;
  attributeValue: {
    value: string;
    translations?: Array<{ locale: string; label: string }>;
    attribute: { key: string };
  } | null;
};

/**
 * Maps ProductVariant.options (Prisma include) to display lines for the given storefront locale.
 */
export function cartVariantDisplayLinesFromPrismaOptions(
  options: PrismaCartVariantOption[] | undefined | null,
  locale: string
): CartVariantDisplayLine[] {
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }

  const lines: CartVariantDisplayLine[] = [];

  for (const opt of options) {
    if (opt.attributeValue) {
      const av = opt.attributeValue;
      const key = (av.attribute?.key || "").trim() || "option";
      const valueTrans = pickLocaleRow(av.translations, locale);
      const valueLabel = (valueTrans?.label?.trim() || av.value || "").trim();
      if (!valueLabel) {
        continue;
      }
      lines.push({ attributeKey: key, valueLabel });
      continue;
    }

    const key = (opt.attributeKey || "").trim();
    const val = (opt.value || "").trim();
    if (!key || !val) {
      continue;
    }
    lines.push({ attributeKey: key, valueLabel: val });
  }

  return lines;
}

type ProductApiVariantOption = {
  attribute?: string;
  key?: string;
  value?: string;
  label?: string;
};

/**
 * Maps storefront product API variant.options to the same cart display shape.
 */
export function cartVariantDisplayLinesFromProductApiOptions(
  options: ProductApiVariantOption[] | undefined | null
): CartVariantDisplayLine[] {
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }

  const lines: CartVariantDisplayLine[] = [];
  for (const o of options) {
    const key = (o.key || o.attribute || "").trim();
    const valueLabel = (o.label || o.value || "").trim();
    if (!key || !valueLabel) {
      continue;
    }
    lines.push({ attributeKey: key, valueLabel });
  }
  return lines;
}

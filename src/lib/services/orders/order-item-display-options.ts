import { db } from "@white-shop/db";
import {
  normalizeProductCustomizations,
  type ProductCustomizations,
} from "@/lib/cart/customizations";

export interface OrderItemVariantOption {
  attributeKey?: string;
  value?: string;
  label?: string;
  imageUrl?: string;
  colors?: unknown;
}

type VariantOptionRow = {
  attributeKey: string | null;
  value: string | null;
  valueId: string | null;
  attributeValue: {
    value: string;
    imageUrl: string | null;
    colors: unknown;
    translations: Array<{
      locale: string;
      label: string;
    }>;
    attribute: {
      key: string;
    };
  } | null;
};

function pickTranslationLabel(
  translations: Array<{ locale: string; label: string }>,
  locale: string
): string | undefined {
  const preferred =
    translations.find((row) => row.locale === locale) ??
    translations.find((row) => row.locale === "en") ??
    translations[0];
  return preferred?.label?.trim() || undefined;
}

function formatStoredVariantOption(opt: VariantOptionRow): OrderItemVariantOption {
  if (opt.attributeValue) {
    const label = pickTranslationLabel(opt.attributeValue.translations, "en") ?? opt.attributeValue.value;
    return {
      attributeKey: opt.attributeValue.attribute.key || undefined,
      value: opt.attributeValue.value || undefined,
      label: label || undefined,
      imageUrl: opt.attributeValue.imageUrl || undefined,
      colors: opt.attributeValue.colors || undefined,
    };
  }

  return {
    attributeKey: opt.attributeKey || undefined,
    value: opt.value || undefined,
    label: opt.value || undefined,
  };
}

export function collectSelectedAttributeValueIds(
  items: Array<{ customizations?: unknown }>
): string[] {
  const ids = new Set<string>();

  for (const item of items) {
    const custom = normalizeProductCustomizations(item.customizations);
    for (const id of custom?.selectedAttributeValueIds ?? []) {
      ids.add(id);
    }
  }

  return [...ids];
}

export async function loadOrderItemAttributeValueOptions(
  valueIds: string[],
  locale = "hy"
): Promise<Map<string, OrderItemVariantOption>> {
  if (valueIds.length === 0) {
    return new Map();
  }

  const rows = await db.attributeValue.findMany({
    where: { id: { in: valueIds } },
    include: {
      translations: true,
      attribute: { select: { key: true } },
    },
  });

  const map = new Map<string, OrderItemVariantOption>();
  for (const row of rows) {
    const label = pickTranslationLabel(row.translations, locale) ?? row.value;
    map.set(row.id, {
      attributeKey: row.attribute.key || undefined,
      value: row.value || undefined,
      label: label || undefined,
      imageUrl: row.imageUrl || undefined,
      colors: row.colors ?? undefined,
    });
  }

  return map;
}

function appendTextCustomizationOptions(
  options: OrderItemVariantOption[],
  custom: ProductCustomizations
): void {
  if (custom.additions) {
    options.push({ attributeKey: "additions", label: custom.additions, value: custom.additions });
  }
  if (custom.exclusions) {
    options.push({ attributeKey: "exclusions", label: custom.exclusions, value: custom.exclusions });
  }
}

export function buildOrderItemVariantOptions(
  item: {
    customizations?: unknown;
    variant?: {
      options?: VariantOptionRow[];
    } | null;
  },
  valueMap: Map<string, OrderItemVariantOption>
): OrderItemVariantOption[] {
  const custom = normalizeProductCustomizations(item.customizations);
  const hasAttributeSelections = (custom?.selectedAttributeValueIds?.length ?? 0) > 0;
  const hasTextCustomizations = Boolean(custom?.additions || custom?.exclusions);

  if (hasAttributeSelections || hasTextCustomizations) {
    const options: OrderItemVariantOption[] = [];

    for (const id of custom?.selectedAttributeValueIds ?? []) {
      const resolved = valueMap.get(id);
      if (resolved) {
        options.push(resolved);
      }
    }

    if (custom) {
      appendTextCustomizationOptions(options, custom);
    }

    if (options.length > 0) {
      return options;
    }
  }

  return (item.variant?.options ?? []).map(formatStoredVariantOption);
}

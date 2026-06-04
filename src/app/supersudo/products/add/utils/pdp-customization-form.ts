import { isCustomizationAttributeKey } from '@/lib/products/pdp-customization-config';
import type { PdpCustomizationConfig, PdpCustomizationItem, PdpCustomizationRole } from '@/lib/products/pdp-customization-config';
import { parsePdpCustomizationConfig } from '@/lib/products/pdp-customization-config';
import type { Attribute } from '../types';

export type PdpCustomizationValueFormState = {
  enabled: boolean;
  role: PdpCustomizationRole;
  priceAdjustment: string;
};

export type PdpCustomizationFormState = Record<string, PdpCustomizationValueFormState>;

export function getCustomizationAttributes(attributes: Attribute[]): Attribute[] {
  return attributes.filter((a) => isCustomizationAttributeKey(a.key));
}

/** Attributes chosen in the product form for PDP customization. */
export function getSelectedCustomizationAttributes(
  attributes: Attribute[],
  selectedAttributeIds: Set<string>,
): Attribute[] {
  return attributes.filter((a) => selectedAttributeIds.has(a.id));
}

export function createEmptyCustomizationFormState(): PdpCustomizationFormState {
  return {};
}

export function ensureFormStateForAttribute(
  prev: PdpCustomizationFormState,
  attribute: Attribute,
): PdpCustomizationFormState {
  const next = { ...prev };
  for (const value of attribute.values) {
    if (!next[value.id]) {
      next[value.id] = {
        enabled: false,
        role: isAddonAttributeKey(attribute.key) ? 'addon' : 'default',
        priceAdjustment: String(value.priceAdjustment ?? 0),
      };
    }
  }
  return next;
}

export function inferSelectedCustomizationAttributeIds(
  attributes: Attribute[],
  formState: PdpCustomizationFormState,
  config: PdpCustomizationConfig | null,
): Set<string> {
  const ids = new Set<string>();

  if (config?.items.length) {
    for (const item of config.items) {
      const attr = attributes.find((a) => a.values.some((v) => v.id === item.valueId));
      if (attr) {
        ids.add(attr.id);
      }
    }
  }

  for (const attr of attributes) {
    if (attr.values.some((v) => formState[v.id]?.enabled)) {
      ids.add(attr.id);
    }
  }

  return ids;
}

export function disableAttributeValuesInFormState(
  prev: PdpCustomizationFormState,
  attribute: Attribute,
): PdpCustomizationFormState {
  const next = { ...prev };
  for (const value of attribute.values) {
    if (next[value.id]) {
      next[value.id] = { ...next[value.id], enabled: false };
    }
  }
  return next;
}

function isAddonAttributeKey(attrKey: string): boolean {
  const normalized = attrKey.toLowerCase();
  return normalized === 'topping' || normalized === 'toppings' || normalized === 'component' || normalized === 'components';
}

export function hydrateCustomizationFormState(
  attributes: Attribute[],
  config: PdpCustomizationConfig | null,
  variantDefaultValueIds: string[],
): PdpCustomizationFormState {
  let state = createEmptyCustomizationFormState();
  const roleMap = new Map<string, PdpCustomizationRole>();
  const attrsToSeed = new Set<string>();

  if (config) {
    for (const item of config.items) {
      roleMap.set(item.valueId, item.role);
      const attr = attributes.find((a) => a.values.some((v) => v.id === item.valueId));
      if (attr) {
        attrsToSeed.add(attr.id);
      }
    }
  }

  for (const valueId of variantDefaultValueIds) {
    const attr = attributes.find((a) => a.values.some((v) => v.id === valueId));
    if (attr) {
      attrsToSeed.add(attr.id);
    }
  }

  for (const attrId of attrsToSeed) {
    const attr = attributes.find((a) => a.id === attrId);
    if (attr) {
      state = ensureFormStateForAttribute(state, attr);
    }
  }

  for (const valueId of variantDefaultValueIds) {
    if (state[valueId]) {
      state[valueId] = {
        ...state[valueId],
        enabled: true,
        role: roleMap.get(valueId) ?? 'default',
      };
    }
  }

  if (config) {
    for (const item of config.items) {
      const attr = attributes.find((a) => a.values.some((v) => v.id === item.valueId));
      if (attr) {
        state = ensureFormStateForAttribute(state, attr);
      }
      if (!state[item.valueId]) {
        continue;
      }
      state[item.valueId] = {
        ...state[item.valueId],
        enabled: true,
        role: item.role,
      };
    }
  }

  return state;
}

export function collectVariantDefaultCustomizationValueIds(
  variants: Array<{ options?: Array<{ valueId?: string; attributeKey?: string }> }> | undefined,
  attributes: Attribute[],
): string[] {
  const knownValueIds = new Set<string>();
  for (const attr of attributes) {
    for (const value of attr.values) {
      knownValueIds.add(value.id);
    }
  }

  const ids = new Set<string>();
  for (const variant of variants ?? []) {
    for (const opt of variant.options ?? []) {
      const valueId = opt.valueId?.trim();
      if (valueId && knownValueIds.has(valueId)) {
        ids.add(valueId);
      }
    }
  }
  return Array.from(ids);
}

export function buildPdpCustomizationItems(
  formState: PdpCustomizationFormState,
): PdpCustomizationItem[] {
  const items: PdpCustomizationItem[] = [];
  for (const [valueId, row] of Object.entries(formState)) {
    if (!row.enabled) {
      continue;
    }
    items.push({ valueId, role: row.role });
  }
  return items;
}

export function buildDefaultVariantOptions(
  formState: PdpCustomizationFormState,
  attributes: Attribute[],
  selectedAttributeIds: Set<string>,
): Array<{ attributeKey: string; value: string; valueId: string }> {
  const options: Array<{ attributeKey: string; value: string; valueId: string }> = [];
  for (const attr of getSelectedCustomizationAttributes(attributes, selectedAttributeIds)) {
    for (const value of attr.values) {
      const row = formState[value.id];
      if (!row?.enabled || row.role !== 'default') {
        continue;
      }
      options.push({
        attributeKey: attr.key,
        value: value.value,
        valueId: value.id,
      });
    }
  }
  return options;
}

export function collectCustomizationAttributeIds(
  formState: PdpCustomizationFormState,
  attributes: Attribute[],
  selectedAttributeIds: Set<string>,
): string[] {
  const ids = new Set<string>();
  for (const attr of getSelectedCustomizationAttributes(attributes, selectedAttributeIds)) {
    const hasEnabled = attr.values.some((v) => formState[v.id]?.enabled);
    if (hasEnabled) {
      ids.add(attr.id);
    }
  }
  return Array.from(ids);
}

export function mergeDefaultOptionsIntoVariants<
  T extends { options?: Array<{ attributeKey: string; value: string; valueId?: string }> },
>(variants: T[], defaultOptions: Array<{ attributeKey: string; value: string; valueId: string }>): T[] {
  if (defaultOptions.length === 0) {
    return variants;
  }

  return variants.map((variant) => {
    const existing = [...(variant.options ?? [])];
    const existingValueIds = new Set(
      existing.map((o) => o.valueId).filter((id): id is string => Boolean(id)),
    );

    for (const opt of defaultOptions) {
      if (!existingValueIds.has(opt.valueId)) {
        existing.push(opt);
        existingValueIds.add(opt.valueId);
      }
    }

    return {
      ...variant,
      options: existing.length > 0 ? existing : undefined,
    };
  });
}

export function parseProductPdpCustomization(raw: unknown): PdpCustomizationConfig | null {
  return parsePdpCustomizationConfig(raw);
}

export type AttributeValuePricePatch = {
  attributeId: string;
  valueId: string;
  priceAdjustment: number;
};

export function collectAttributeValuePricePatches(
  formState: PdpCustomizationFormState,
  attributes: Attribute[],
  selectedAttributeIds: Set<string>,
): AttributeValuePricePatch[] {
  const patches: AttributeValuePricePatch[] = [];

  for (const attr of getSelectedCustomizationAttributes(attributes, selectedAttributeIds)) {
    for (const value of attr.values) {
      const row = formState[value.id];
      if (!row?.enabled || row.role !== 'addon') {
        continue;
      }
      const parsed = Number.parseFloat(row.priceAdjustment);
      if (!Number.isFinite(parsed)) {
        continue;
      }
      const prev = value.priceAdjustment ?? 0;
      if (parsed === prev) {
        continue;
      }
      patches.push({
        attributeId: attr.id,
        valueId: value.id,
        priceAdjustment: parsed,
      });
    }
  }

  return patches;
}

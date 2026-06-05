const PDP_CUSTOMIZATION_ATTR_KEYS = [
  'ingredient',
  'ingredients',
  'component',
  'components',
  'topping',
  'toppings',
  'sauce',
  'garlic',
] as const;

export type PdpCustomizationRole = 'default' | 'addon';

export type PdpCustomizationItem = {
  valueId: string;
  role: PdpCustomizationRole;
};

export type PdpCustomizationConfig = {
  items: PdpCustomizationItem[];
};

const VALID_ROLES = new Set<PdpCustomizationRole>(['default', 'addon']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parse product.pdpCustomization JSON from DB or API.
 */
export function parsePdpCustomizationConfig(raw: unknown): PdpCustomizationConfig | null {
  if (!isRecord(raw) || !Array.isArray(raw.items)) {
    return null;
  }

  const items: PdpCustomizationItem[] = [];
  for (const entry of raw.items) {
    if (!isRecord(entry)) {
      continue;
    }
    const valueId = typeof entry.valueId === 'string' ? entry.valueId.trim() : '';
    const role = entry.role;
    if (!valueId || !VALID_ROLES.has(role as PdpCustomizationRole)) {
      continue;
    }
    items.push({ valueId, role: role as PdpCustomizationRole });
  }

  return items.length > 0 ? { items } : null;
}

export function serializePdpCustomizationConfig(
  items: PdpCustomizationItem[],
): PdpCustomizationConfig | null {
  const normalized = items.filter((item) => item.valueId.trim().length > 0);
  return normalized.length > 0 ? { items: normalized } : null;
}

export function roleByValueId(config: PdpCustomizationConfig | null): Map<string, PdpCustomizationRole> {
  const map = new Map<string, PdpCustomizationRole>();
  if (!config) {
    return map;
  }
  for (const item of config.items) {
    map.set(item.valueId, item.role);
  }
  return map;
}

export function isCustomizationAttributeKey(attrKey: string): boolean {
  const normalized = attrKey.toLowerCase().trim();
  return (PDP_CUSTOMIZATION_ATTR_KEYS as readonly string[]).includes(normalized);
}

/** Addition attributes — admin sets price only (optional add-ons on PDP). */
const ADDITION_PRICE_ONLY_ATTR_KEYS = [
  'ingredient',
  'ingredients',
  'component',
  'components',
] as const;

/** Exclusion attributes — admin enables choices only (included by default on PDP). */
const EXCLUSION_SELECTION_ONLY_ATTR_KEYS = ['topping', 'toppings'] as const;

export function isAdditionPriceOnlyAttributeKey(attrKey: string): boolean {
  const normalized = attrKey.toLowerCase().trim();
  return (ADDITION_PRICE_ONLY_ATTR_KEYS as readonly string[]).includes(normalized);
}

export function isExclusionSelectionOnlyAttributeKey(attrKey: string): boolean {
  const normalized = attrKey.toLowerCase().trim();
  return (EXCLUSION_SELECTION_ONLY_ATTR_KEYS as readonly string[]).includes(normalized);
}

export type PdpCustomizationLayoutColumn = 'addition' | 'exclusion' | 'other';

function resolvePdpCustomizationLayoutColumn(normalizedKey: string): PdpCustomizationLayoutColumn {
  if (normalizedKey === 'ingredient' || normalizedKey === 'ingredients') {
    return 'addition';
  }
  if (normalizedKey === 'topping' || normalizedKey === 'toppings') {
    return 'exclusion';
  }
  return 'other';
}

/** Admin form columns: ingredient (left) vs topping (right). */
export function getPdpCustomizationLayoutColumn(attrKey: string): PdpCustomizationLayoutColumn {
  return resolvePdpCustomizationLayoutColumn(attrKey.toLowerCase().trim());
}

/** Admin product form: only ingredient (addition) and topping (exclusion). */
export function isAdminProductFormCustomizationAttributeKey(attrKey: string): boolean {
  return getPdpCustomizationLayoutColumn(attrKey) !== 'other';
}

export function filterAdminProductFormCustomizationAttributes<T extends { key: string }>(
  attributes: T[],
): T[] {
  return attributes.filter((attribute) => isAdminProductFormCustomizationAttributeKey(attribute.key));
}

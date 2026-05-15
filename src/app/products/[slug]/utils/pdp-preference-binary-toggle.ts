import type { AttributeGroupValue } from '../types';

export interface PdpPreferenceBinaryToggle {
  /** Stored selection value when the checkbox is checked. */
  onVal: string;
  /** Stored selection value when the checkbox is cleared. */
  offVal: string;
  /** Slug passed to `getAttributeLabel` for the “on” option label. */
  onSlug: string;
}

function canonicalStoredValue(g: AttributeGroupValue): string {
  if (g.valueId !== undefined && g.valueId !== '') {
    return String(g.valueId);
  }
  return g.value.toLowerCase().trim();
}

function looksPositiveToken(text: string): boolean {
  const s = text.toLowerCase().trim();
  if (!s) {
    return false;
  }
  return (
    /^(yes|y|1|true|with|add|spicy|extra)$/i.test(s) ||
    /(այո|կա)/i.test(s)
  );
}

/**
 * When a preference has exactly two mutually exclusive values, render a single checkbox
 * instead of a pill row. Returns `null` if the group is not a clear binary pair.
 */
export function resolvePreferenceBinaryToggle(
  _attrKey: string,
  attrGroups: AttributeGroupValue[],
): PdpPreferenceBinaryToggle | null {
  if (attrGroups.length !== 2) {
    return null;
  }
  const [a, b] = [...attrGroups].sort((x, y) =>
    canonicalStoredValue(x).localeCompare(canonicalStoredValue(y)),
  );

  let onGroup = b;
  let offGroup = a;
  const aPos = looksPositiveToken(a.value) || looksPositiveToken(a.label);
  const bPos = looksPositiveToken(b.value) || looksPositiveToken(b.label);
  if (aPos && !bPos) {
    onGroup = a;
    offGroup = b;
  } else if (bPos && !aPos) {
    onGroup = b;
    offGroup = a;
  }

  return {
    onVal: canonicalStoredValue(onGroup),
    offVal: canonicalStoredValue(offGroup),
    onSlug: onGroup.value,
  };
}

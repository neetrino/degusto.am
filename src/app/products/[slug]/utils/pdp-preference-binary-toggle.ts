import type { AttributeGroupValue } from '../types';

const PDP_BINARY_SLUG_PAIRS: Record<string, { onSlug: string; offSlug: string }> = {
  spicy: { onSlug: 'spicy', offSlug: 'not-spicy' },
  greens: { onSlug: 'with-greens', offSlug: 'without-greens' },
  garlic: { onSlug: 'with-garlic', offSlug: 'without-garlic' },
};

function optionValForSlug(
  groups: AttributeGroupValue[],
  slug: string,
): string | null {
  const normalized = slug.toLowerCase().trim();
  const g = groups.find((x) => x.value?.toLowerCase().trim() === normalized);
  return g ? String(g.valueId || g.value) : null;
}

/**
 * One checkbox per preference: checked = "on" slug, unchecked = "off" slug (never empty).
 * Sauce: checked = first non–no-sauce option in the product, unchecked = no-sauce when both exist.
 */
export function resolvePreferenceBinaryToggle(
  attrKey: string,
  attrGroups: AttributeGroupValue[],
): { onVal: string; offVal: string; onSlug: string } | null {
  if (attrKey === 'sauce') {
    const offG = attrGroups.find((x) => x.value?.toLowerCase().trim() === 'no-sauce');
    const onG = attrGroups.find((x) => x.value?.toLowerCase().trim() !== 'no-sauce');
    if (!offG || !onG) return null;
    return {
      onVal: String(onG.valueId || onG.value),
      offVal: String(offG.valueId || offG.value),
      onSlug: onG.value,
    };
  }

  const pair = PDP_BINARY_SLUG_PAIRS[attrKey];
  if (!pair) return null;
  const onVal = optionValForSlug(attrGroups, pair.onSlug);
  const offVal = optionValForSlug(attrGroups, pair.offSlug);
  if (!onVal || !offVal) return null;
  return { onVal, offVal, onSlug: pair.onSlug };
}

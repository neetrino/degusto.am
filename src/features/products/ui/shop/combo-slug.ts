const COMBO_SLUGS = new Set([
  "combo",
  "combos",
  "kombo",
  "combo-packages",
  "combo-paketner",
  "combo-packs",
  "kombo-pakety",
]);

const COMBO_SLUG_PREFIX = /^(combo|combos|kombo)(-|$)/i;
/** Live catalog sometimes stores the title as the slug (e.g. «Կոմբո փաթեթներ»). */
const COMBO_LABEL_PATTERN = /combo|կոմբո|комбо/i;

/** True for locale / catalog variants of the Combos category slug or title. */
export function isComboSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return false;
  return (
    COMBO_SLUGS.has(normalized) ||
    COMBO_SLUG_PREFIX.test(normalized) ||
    COMBO_LABEL_PATTERN.test(normalized)
  );
}


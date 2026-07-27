const COMBO_SLUGS = new Set(["combo", "combos", "kombo"]);

/** True for locale variants of the Combos category slug. */
export function isComboSlug(slug: string): boolean {
  return COMBO_SLUGS.has(slug.trim().toLowerCase());
}

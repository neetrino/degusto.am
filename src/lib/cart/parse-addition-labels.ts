const MAX_ADDITION_LABELS = 32;

/** Parse comma-separated Add-pill labels for pricing lookups. */
export function parseAdditionLabels(additions: string | undefined): string[] {
  return (additions ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_ADDITION_LABELS);
}

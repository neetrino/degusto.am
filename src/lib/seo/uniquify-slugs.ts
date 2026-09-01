/** Suffixes `-2`, `-3`, … when computed slugs collide in a list. */
export function uniquifySlugs<T extends { slug: string }>(
  items: readonly T[],
): T[] {
  const seen = new Set<string>();
  return items.map((item) => {
    const base = item.slug.trim() || "item";
    if (!seen.has(base)) {
      seen.add(base);
      return item;
    }

    let n = 2;
    let candidate = `${base}-${n}`;
    while (seen.has(candidate)) {
      n += 1;
      candidate = `${base}-${n}`;
    }
    seen.add(candidate);
    return { ...item, slug: candidate };
  });
}

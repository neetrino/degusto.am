export interface ParsedProductSlugParam {
  slug: string;
  variantIdFromUrl: string | null;
}

/** Supports `/products/my-slug` and `/products/my-slug:variantId` URLs. */
export function parseProductSlugParam(rawSlug: string): ParsedProductSlugParam {
  const slugParts = rawSlug.includes(':') ? rawSlug.split(':') : [rawSlug];
  const slug = slugParts[0] ?? '';
  const variantIdFromUrl = slugParts.length > 1 ? (slugParts[1] ?? null) : null;
  return { slug, variantIdFromUrl };
}

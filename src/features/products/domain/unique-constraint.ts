function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if (!(current instanceof Error)) break;
    parts.push(current.message);
    const extra = current as Error & {
      cause?: unknown;
      constraint?: string;
      detail?: string;
      code?: string;
    };
    if (extra.constraint) parts.push(extra.constraint);
    if (extra.detail) parts.push(extra.detail);
    if (extra.code) parts.push(extra.code);
    current = extra.cause;
  }

  return parts.join(" ");
}

/** True when Postgres/Drizzle reports a product SKU or slug unique violation. */
export function isProductUniqueViolation(error: unknown): boolean {
  const text = collectErrorText(error);
  return (
    text.includes("products_sku_uidx") ||
    text.includes("products_slug_") ||
    text.includes("duplicate key") ||
    text.includes("23505")
  );
}

/** User-facing message for a product unique constraint failure. */
export function uniqueConstraintMessage(error: unknown): string {
  const text = collectErrorText(error);
  if (text.includes("products_sku_uidx")) {
    return "A product with this SKU already exists.";
  }
  if (text.includes("products_slug_")) {
    return "A product with this title/slug already exists.";
  }
  return "A product with this SKU or title already exists.";
}

import { and, eq, ne, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { products, type TranslationsJson } from "@/db/schema";
import {
  isProductUniqueViolation,
  uniqueConstraintMessage,
} from "@/features/products/domain/unique-constraint";
import { createId } from "@/lib/id";
import { locales } from "@/lib/i18n/config";
import { err, type Result } from "@/lib/result";

export { isProductUniqueViolation, uniqueConstraintMessage };

const MAX_SLUG_LENGTH = 120;
const SLUG_SUFFIX_ATTEMPTS = 50;

/** Returns a validation error when another product already uses the SKU. */
export async function assertSkuAvailable(
  sku: string,
  currentProductId?: string,
): Promise<Result<{ id: string }> | null> {
  const [row] = await getDb()
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, sku))
    .limit(1);
  if (row && row.id !== currentProductId) {
    return err("VALIDATION_ERROR", "A product with this SKU already exists.");
  }
  return null;
}

async function isSlugTaken(
  slug: string,
  excludeProductId?: string,
): Promise<boolean> {
  const slugMatch = or(
    sql`${products.translations}->'hy'->>'slug' = ${slug}`,
    sql`${products.translations}->'en'->>'slug' = ${slug}`,
    sql`${products.translations}->'ru'->>'slug' = ${slug}`,
  );
  const [row] = await getDb()
    .select({ id: products.id })
    .from(products)
    .where(
      excludeProductId
        ? and(slugMatch, ne(products.id, excludeProductId))
        : slugMatch,
    )
    .limit(1);
  return Boolean(row);
}

/** Picks a unique catalog slug, suffixing `-2`, `-3`, … when needed. */
export async function allocateUniqueProductSlug(
  baseSlug: string,
  excludeProductId?: string,
): Promise<string> {
  const base = baseSlug.trim().slice(0, MAX_SLUG_LENGTH) || "product";
  if (!(await isSlugTaken(base, excludeProductId))) {
    return base;
  }

  for (let n = 2; n <= SLUG_SUFFIX_ATTEMPTS; n += 1) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, MAX_SLUG_LENGTH - suffix.length)}${suffix}`;
    if (!(await isSlugTaken(candidate, excludeProductId))) {
      return candidate;
    }
  }

  const fallback = `-${createId().slice(0, 8)}`;
  return `${base.slice(0, MAX_SLUG_LENGTH - fallback.length)}${fallback}`;
}

/** Writes the same slug onto every present locale translation. */
export function withSharedProductSlug(
  translations: TranslationsJson,
  slug: string,
): TranslationsJson {
  const next: TranslationsJson = { ...translations };
  for (const loc of locales) {
    const entry = next[loc];
    if (!entry) continue;
    next[loc] = { ...entry, slug };
  }
  return next;
}

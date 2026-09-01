import "server-only";

import { and, isNull, ne, or, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { categories } from "@/db/schema";
import { err, type Result } from "@/lib/result";

/** Returns a validation error when another category already uses this slug. */
export async function assertCategorySlugAvailable(
  slug: string,
  excludeCategoryId?: string,
): Promise<Result<{ id: string }> | null> {
  const slugMatch = or(
    sql`${categories.translations}->'hy'->>'slug' = ${slug}`,
    sql`${categories.translations}->'en'->>'slug' = ${slug}`,
    sql`${categories.translations}->'ru'->>'slug' = ${slug}`,
  );

  const [row] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(
      excludeCategoryId
        ? and(
            slugMatch,
            isNull(categories.deletedAt),
            ne(categories.id, excludeCategoryId),
          )
        : and(slugMatch, isNull(categories.deletedAt)),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return err("VALIDATION_ERROR", "A category with this slug already exists.");
}

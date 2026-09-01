import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { getDb } from "@/db/client";
import { productCategories } from "@/db/schema";
import type { DbTransaction } from "@/db/transaction";

type DbClient = Pick<ReturnType<typeof getDb>, "selectDistinct">;

/**
 * Counts distinct primary categories among the given product ids.
 * Products without a primary category do not contribute.
 */
export async function countDistinctPrimaryCategories(
  productIds: readonly string[],
  client: DbClient | DbTransaction = getDb(),
): Promise<number> {
  if (productIds.length === 0) {
    return 0;
  }

  const rows = await client
    .selectDistinct({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(
      and(
        inArray(productCategories.productId, [...productIds]),
        eq(productCategories.isPrimary, true),
      ),
    );

  return rows.length;
}

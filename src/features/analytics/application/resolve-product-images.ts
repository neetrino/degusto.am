import "server-only";

import { and, asc, eq, inArray, or } from "drizzle-orm";

import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { resolveMediaPublicUrl } from "@/lib/media/public-url";

/**
 * Loads primary READY media URLs for catalog product ids.
 * Used when order-item image snapshots are missing (legacy/import rows).
 */
export async function resolvePrimaryProductImageUrls(
  productIds: readonly string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(productIds.filter((id) => id.length > 0))];
  const map = new Map<string, string>();
  if (uniqueIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.productId, uniqueIds),
        eq(mediaAssets.uploadStatus, "READY"),
        or(eq(mediaAssets.isPrimary, true), eq(mediaAssets.role, "PRIMARY")),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder));

  for (const row of rows) {
    if (!row.productId || map.has(row.productId)) {
      continue;
    }
    map.set(row.productId, await resolveMediaPublicUrl(row.objectKey));
  }

  return map;
}

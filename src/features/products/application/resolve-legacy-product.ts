import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db/client";
import { products } from "@/db/schema";
import { isDemoSeedEntityId } from "@/db/seed/seed-uuid";
import {
  legacyProductCatalogPath,
  legacyProductDetailPath,
  parseLegacyProductId,
} from "@/lib/legacy-urls/legacy-product-id";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { pickCanonicalUrlSlug } from "@/lib/seo/url-slug";

/**
 * Resolves an old `/product/:id` URL to a storefront path.
 *
 * Live degusto.am puts the MySQL numeric id in the path and a separate
 * article code ("Կոդ", e.g. `fQfUBT91OYl7`) in the catalog. This schema
 * has no `old_id` column; catalog import scripts are not in the repo.
 * Lookup is therefore only `products.sku === numeric id` for ACTIVE,
 * non-deleted, non-demo rows. Misses go to `/{locale}/products`, never `/`.
 */
export async function resolveLegacyProductRedirect(
  locale: string,
  rawId: string | null | undefined,
): Promise<string> {
  const resolvedLocale: Locale = isLocale(locale) ? locale : defaultLocale;
  const catalog = legacyProductCatalogPath(resolvedLocale);
  const sku = parseLegacyProductId(rawId);
  if (!sku) {
    return catalog;
  }

  const product = await findActiveProductBySku(sku);
  if (!product) {
    return catalog;
  }

  const slug = pickCanonicalUrlSlug(product.translations, product.sku);
  return legacyProductDetailPath(resolvedLocale, slug);
}

async function findActiveProductBySku(sku: string): Promise<{
  sku: string;
  translations: (typeof products.$inferSelect)["translations"];
} | null> {
  const [row] = await getDb()
    .select({
      id: products.id,
      sku: products.sku,
      translations: products.translations,
    })
    .from(products)
    .where(
      and(
        eq(products.sku, sku),
        eq(products.status, "ACTIVE"),
        isNull(products.deletedAt),
      ),
    )
    .limit(1);

  if (!row || isDemoSeedEntityId(row.id)) {
    return null;
  }
  return row;
}

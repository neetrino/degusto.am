import "server-only";

import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { cache } from "react";

import { getDb } from "@/db/client";
import {
  categories,
  mediaAssets,
  productCategories,
  productModifiers,
  products,
} from "@/db/schema";
import { DEMO_SEED_ENTITY_ID_PREFIX } from "@/db/seed/seed-uuid";
import { canonicalCategorySlug } from "@/features/categories/domain/canonical-category-slug";
import { resolveProductPrices } from "@/features/promotions/application/resolve-product-prices";
import type {
  CatalogProduct,
  ProductCategoryRef,
  ProductDetail,
  ProductGalleryImage,
} from "@/features/products/types";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";
import { resolveMediaPublicUrl } from "@/lib/media/public-url";
import { isAsciiSlug, pickCanonicalUrlSlug } from "@/lib/seo/url-slug";

export type {
  CatalogProduct,
  ProductCategoryRef,
  ProductDetail,
  ProductGalleryImage,
} from "@/features/products/types";

const RELATED_PRODUCTS_LIMIT = 8;
/** Matches live degusto-am shop grid (3×4). */
export const CATALOG_PAGE_SIZE = 12;
/** PostgreSQL `integer` max — price filters must stay within this range. */
const PRICE_FILTER_MAX = 2_147_483_647;

export type CatalogListFilters = {
  categorySlug?: string | null;
  categoryId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  query?: string | null;
  diet?: "none" | "veg" | "spicy" | null;
};

function toPriceFilterInt(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  const normalized = Math.floor(value);
  if (
    !Number.isSafeInteger(normalized) ||
    normalized < 0 ||
    normalized > PRICE_FILTER_MAX
  ) {
    return null;
  }
  return normalized;
}

function toCatalogProduct(
  product: typeof products.$inferSelect,
  locale: Locale,
  imageUrl: string | null = null,
): Omit<
  CatalogProduct,
  "priceAmount" | "compareAtAmount" | "discountPercent" | "listPriceAmount"
> | null {
  const translation = product.translations[locale] ?? product.translations.hy;
  if (!translation) {
    return null;
  }

  return {
    id: product.id,
    sku: product.sku,
    stockOnHand: product.stockOnHand,
    isSpicy: product.isSpicy,
    isVegetarian: product.isVegetarian,
    translation: {
      ...translation,
      slug: pickCanonicalUrlSlug(
        product.translations,
        translation.slug || "product",
      ),
    },
    imageUrl,
  };
}

async function loadPrimaryProductImages(
  productIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      productId: mediaAssets.productId,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
      role: mediaAssets.role,
      sortOrder: mediaAssets.sortOrder,
    })
    .from(mediaAssets)
    .where(
      and(
        inArray(mediaAssets.productId, productIds),
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

async function withProductImages(
  rows: Array<typeof products.$inferSelect>,
  locale: Locale,
): Promise<CatalogProduct[]> {
  const productIds = rows.map((row) => row.id);
  const [images, prices] = await Promise.all([
    loadPrimaryProductImages(productIds),
    resolveProductPrices(
      rows.map((row) => ({
        id: row.id,
        priceAmount: row.priceAmount,
        compareAtAmount: row.compareAtAmount,
      })),
    ),
  ]);

  return rows
    .map((product) => {
      const base = toCatalogProduct(
        product,
        locale,
        images.get(product.id) ?? null,
      );
      if (!base) return null;

      const resolved = prices.get(product.id);
      return {
        ...base,
        listPriceAmount: resolved?.listAmount ?? product.priceAmount,
        priceAmount: resolved?.unitAmount ?? product.priceAmount,
        compareAtAmount: resolved?.compareAtAmount ?? null,
        discountPercent: resolved?.discountPercent ?? null,
      } satisfies CatalogProduct;
    })
    .filter((product): product is CatalogProduct => product !== null);
}

/**
 * Storefront catalog eligibility.
 * Hides demo/figma seed rows (same ID-prefix rule as storefront categories)
 * while leaving them available in admin/dev seed.
 */
const notDemoSeedProduct = sql`${products.id}::text not like ${`${DEMO_SEED_ENTITY_ID_PREFIX}%`}`;

const activeCatalogWhere = and(
  eq(products.status, "ACTIVE"),
  isNull(products.deletedAt),
  notDemoSeedProduct,
);

/** Active products by id — used by wishlist (not shared-cache; IDs are user-specific). */
export async function getActiveProductsByIds(
  locale: Locale,
  productIds: string[],
): Promise<CatalogProduct[]> {
  if (productIds.length === 0) {
    return [];
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(inArray(products.id, productIds), activeCatalogWhere));

  return withProductImages(rows, locale);
}

function buildCatalogWhere(
  locale: Locale,
  filters: CatalogListFilters,
): ReturnType<typeof and> {
  const clauses = [activeCatalogWhere];

  const categoryId = filters.categoryId?.trim();
  const categorySlug = filters.categorySlug?.trim();
  if (categoryId) {
    clauses.push(
      sql`exists (
        select 1
        from ${productCategories}
        inner join ${categories}
          on ${categories.id} = ${productCategories.categoryId}
        where ${productCategories.productId} = ${products.id}
          and ${categories.id} = ${categoryId}
          and ${categories.status} = 'ACTIVE'
          and ${categories.deletedAt} is null
      )`,
    );
  } else if (categorySlug && categorySlug !== "all") {
    clauses.push(
      sql`exists (
        select 1
        from ${productCategories}
        inner join ${categories}
          on ${categories.id} = ${productCategories.categoryId}
        where ${productCategories.productId} = ${products.id}
          and ${categories.status} = 'ACTIVE'
          and ${categories.deletedAt} is null
          and (
            ${categories.translations}->${locale}->>'slug' = ${categorySlug}
            or ${categories.translations}->'hy'->>'slug' = ${categorySlug}
            or ${categories.translations}->'en'->>'slug' = ${categorySlug}
            or ${categories.translations}->'ru'->>'slug' = ${categorySlug}
          )
      )`,
    );
  }

  if (filters.minPrice != null && Number.isFinite(filters.minPrice)) {
    const minPrice = toPriceFilterInt(filters.minPrice);
    if (minPrice != null) {
      clauses.push(sql`${products.priceAmount} >= ${minPrice}`);
    }
  }
  if (filters.maxPrice != null && Number.isFinite(filters.maxPrice)) {
    const maxPrice = toPriceFilterInt(filters.maxPrice);
    if (maxPrice != null) {
      clauses.push(sql`${products.priceAmount} <= ${maxPrice}`);
    }
  }

  const q = filters.query?.trim();
  if (q) {
    const pattern = `%${q}%`;
    clauses.push(
      sql`(
        ${products.translations}->${locale}->>'title' ilike ${pattern}
        or ${products.translations}->'hy'->>'title' ilike ${pattern}
        or ${products.translations}->'en'->>'title' ilike ${pattern}
        or ${products.translations}->'ru'->>'title' ilike ${pattern}
      )`,
    );
  }

  if (filters.diet === "spicy") {
    clauses.push(eq(products.isSpicy, true));
  } else if (filters.diet === "veg") {
    clauses.push(eq(products.isVegetarian, true));
  }

  return and(...clauses);
}

async function loadActiveProductsPage(
  locale: Locale,
  page: number,
  filters: CatalogListFilters,
): Promise<{ products: CatalogProduct[]; total: number; pageSize: number }> {
  const offset = (page - 1) * CATALOG_PAGE_SIZE;
  const where = buildCatalogWhere(locale, filters);

  const [[countRow], rows] = await Promise.all([
    getDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(where),
    getDb()
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(CATALOG_PAGE_SIZE)
      .offset(offset),
  ]);

  const enriched = await withProductImages(rows, locale);

  return {
    products: enriched,
    total: countRow?.count ?? 0,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

/** Paginated active catalog for the storefront (tag-cached). */
export async function getActiveProductsPage(
  locale: Locale,
  page: number,
  filters: CatalogListFilters = {},
): Promise<{ products: CatalogProduct[]; total: number; pageSize: number }> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const categorySlug = filters.categorySlug?.trim() || "all";
  const categoryId = filters.categoryId?.trim() || "";
  const minPriceValue = toPriceFilterInt(filters.minPrice);
  const maxPriceValue = toPriceFilterInt(filters.maxPrice);
  const minPrice = minPriceValue != null ? String(minPriceValue) : "";
  const maxPrice = maxPriceValue != null ? String(maxPriceValue) : "";
  const query = filters.query?.trim() || "";
  const diet =
    filters.diet === "veg" || filters.diet === "spicy" ? filters.diet : "none";

  return unstable_cache(
    async () =>
      loadActiveProductsPage(locale, safePage, {
        categorySlug,
        categoryId: categoryId || null,
        minPrice: minPriceValue,
        maxPrice: maxPriceValue,
        query: query || null,
        diet,
      }),
    [
      "active-products-page",
      "ascii-slugs-v1",
      locale,
      String(safePage),
      categorySlug,
      categoryId,
      minPrice,
      maxPrice,
      query,
      diet,
    ],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

/** @deprecated Prefer getActiveProductsPage — kept for narrow internal callers. */
export async function getActiveProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  const result = await getActiveProductsPage(locale, 1);
  if (result.total <= result.pageSize) {
    return result.products;
  }

  const rows = await getDb().select().from(products).where(activeCatalogWhere);
  return withProductImages(rows, locale);
}

async function loadFeaturedProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  const rows = await getDb()
    .select()
    .from(products)
    .where(and(activeCatalogWhere, eq(products.isFeatured, true)))
    .orderBy(desc(products.createdAt))
    .limit(8);

  return withProductImages(rows, locale);
}

export async function getFeaturedProducts(
  locale: Locale,
): Promise<CatalogProduct[]> {
  return unstable_cache(
    async () => loadFeaturedProducts(locale),
    ["featured-products", "ascii-slugs-v1", locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

export async function getProductBySlug(
  locale: Locale,
  slug: string,
): Promise<CatalogProduct | null> {
  const decodedSlug = decodeURIComponent(slug);
  const [product] = await getDb()
    .select()
    .from(products)
    .where(
      and(
        activeCatalogWhere,
        // Match any locale slug so old Unicode URLs and locale-switcher
        // prefix swaps still resolve; the PDP then 308s to the ASCII slug.
        or(
          sql`${products.translations}->'hy'->>'slug' = ${decodedSlug}`,
          sql`${products.translations}->'en'->>'slug' = ${decodedSlug}`,
          sql`${products.translations}->'ru'->>'slug' = ${decodedSlug}`,
        ),
      ),
    )
    .limit(1);

  if (!product) {
    const derived = await findActiveProductByCanonicalSlug(decodedSlug);
    if (!derived) {
      return null;
    }
    const [enriched] = await withProductImages([derived], locale);
    return enriched ?? null;
  }

  const [enriched] = await withProductImages([product], locale);
  return enriched ?? null;
}

async function findActiveProductByCanonicalSlug(
  slug: string,
): Promise<typeof products.$inferSelect | null> {
  if (!isAsciiSlug(slug)) {
    return null;
  }

  const index = await loadCanonicalProductSlugIndex();
  const productId = index[slug];
  if (!productId) {
    return null;
  }

  const [row] = await getDb()
    .select()
    .from(products)
    .where(and(activeCatalogWhere, eq(products.id, productId)))
    .limit(1);
  return row ?? null;
}

async function loadCanonicalProductSlugIndex(): Promise<
  Record<string, string>
> {
  return unstable_cache(
    async () => {
      const rows = await getDb()
        .select({
          id: products.id,
          translations: products.translations,
        })
        .from(products)
        .where(activeCatalogWhere);

      const index: Record<string, string> = {};
      for (const row of rows) {
        const canonical = pickCanonicalUrlSlug(row.translations, "");
        if (canonical && index[canonical] === undefined) {
          index[canonical] = row.id;
        }
      }
      return index;
    },
    ["product-canonical-slug-index", "ascii-slugs-v1"],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

async function loadProductGallery(
  productId: string,
  locale: Locale,
  fallbackTitle: string,
): Promise<ProductGalleryImage[]> {
  const rows = await getDb()
    .select({
      id: mediaAssets.id,
      objectKey: mediaAssets.objectKey,
      isPrimary: mediaAssets.isPrimary,
      sortOrder: mediaAssets.sortOrder,
      altTranslations: mediaAssets.altTranslations,
    })
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.productId, productId),
        eq(mediaAssets.uploadStatus, "READY"),
      ),
    )
    .orderBy(asc(mediaAssets.sortOrder));

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      url: await resolveMediaPublicUrl(row.objectKey),
      alt: row.altTranslations?.[locale] ?? fallbackTitle,
      isPrimary: row.isPrimary,
    })),
  ).then((images) =>
    images.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)),
  );
}

async function loadProductCategories(
  productId: string,
  locale: Locale,
): Promise<ProductCategoryRef[]> {
  const rows = await getDb()
    .select({
      id: categories.id,
      translations: categories.translations,
      isPrimary: productCategories.isPrimary,
      sortOrder: productCategories.sortOrder,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(
      and(
        eq(productCategories.productId, productId),
        eq(categories.status, "ACTIVE"),
        isNull(categories.deletedAt),
      ),
    )
    .orderBy(asc(productCategories.sortOrder));

  return rows
    .map((row) => {
      const translation = row.translations[locale] ?? row.translations.hy;
      if (!translation) return null;
      return {
        id: row.id,
        title: translation.title,
        slug: canonicalCategorySlug(row.translations),
      } satisfies ProductCategoryRef;
    })
    .filter((row): row is ProductCategoryRef => row !== null);
}

/** Primary category title per product id for storefront cards. */
export async function getPrimaryCategoryLabels(
  productIds: readonly string[],
  locale: Locale,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (productIds.length === 0) {
    return map;
  }

  const rows = await getDb()
    .select({
      productId: productCategories.productId,
      translations: categories.translations,
      isPrimary: productCategories.isPrimary,
      sortOrder: productCategories.sortOrder,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .where(
      and(
        inArray(productCategories.productId, [...productIds]),
        eq(categories.status, "ACTIVE"),
        isNull(categories.deletedAt),
      ),
    )
    .orderBy(
      asc(productCategories.isPrimary),
      asc(productCategories.sortOrder),
    );

  // Prefer primary categories; first row wins if already set.
  const sorted = [...rows].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) {
      return a.isPrimary ? -1 : 1;
    }
    return a.sortOrder - b.sortOrder;
  });

  for (const row of sorted) {
    if (map.has(row.productId)) {
      continue;
    }
    const translation = row.translations[locale] ?? row.translations.hy;
    if (translation?.title) {
      map.set(row.productId, translation.title);
    }
  }

  return map;
}

async function loadProductDetailBySlug(
  locale: Locale,
  slug: string,
): Promise<ProductDetail | null> {
  const product = await getProductBySlug(locale, slug);
  if (!product) {
    return null;
  }

  const [images, productCats, modifierRows] = await Promise.all([
    loadProductGallery(product.id, locale, product.translation.title),
    loadProductCategories(product.id, locale),
    getDb()
      .select({
        id: productModifiers.id,
        kind: productModifiers.kind,
        label: productModifiers.label,
        priceAmount: productModifiers.priceAmount,
        sortOrder: productModifiers.sortOrder,
      })
      .from(productModifiers)
      .where(
        and(
          eq(productModifiers.productId, product.id),
          eq(productModifiers.isEnabled, true),
        ),
      )
      .orderBy(asc(productModifiers.sortOrder), asc(productModifiers.createdAt)),
  ]);

  const gallery =
    images.length > 0
      ? images
      : product.imageUrl
        ? [
            {
              id: product.id,
              url: product.imageUrl,
              alt: product.translation.title,
              isPrimary: true,
            },
          ]
        : [];

  const additions: Array<{ id: string; label: string; priceAmount: number }> =
    [];
  const exclusions: Array<{ id: string; label: string }> = [];
  for (const row of modifierRows) {
    if (row.kind === "ADDITION") {
      additions.push({
        id: row.id,
        label: row.label,
        priceAmount: row.priceAmount,
      });
    } else {
      exclusions.push({ id: row.id, label: row.label });
    }
  }

  return {
    ...product,
    images: gallery,
    categories: productCats,
    additions,
    exclusions,
  };
}

/** Full PDP payload — request-deduped; tagged per-slug so edits don't bust other PDPs. */
export const getProductDetailBySlug = cache(
  async (locale: Locale, slug: string): Promise<ProductDetail | null> => {
    return unstable_cache(
      async () => loadProductDetailBySlug(locale, slug),
      ["product-detail", "ascii-slugs-v1", locale, slug],
      {
        tags: [
          CACHE_TAGS.productDetail,
          CACHE_TAGS.productSlug(locale, slug),
        ],
        revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
      },
    )();
  },
);

/** Active products sharing at least one category with the given product. */
export async function getRelatedProducts(
  locale: Locale,
  productId: string,
): Promise<CatalogProduct[]> {
  const seedCategories = getDb()
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, productId));

  const relatedLinks = await getDb()
    .selectDistinct({ productId: productCategories.productId })
    .from(productCategories)
    .where(
      and(
        inArray(productCategories.categoryId, seedCategories),
        sql`${productCategories.productId} <> ${productId}`,
      ),
    );

  const relatedIds = relatedLinks.map((row) => row.productId);
  if (relatedIds.length === 0) {
    return [];
  }

  const rows = await getDb()
    .select()
    .from(products)
    .where(and(inArray(products.id, relatedIds), activeCatalogWhere))
    .limit(RELATED_PRODUCTS_LIMIT);

  return withProductImages(rows, locale);
}

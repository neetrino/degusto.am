import "server-only";

import { and, asc, count, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { getDb } from "@/db/client";
import {
  categories,
  mediaAssets,
  productCategories,
  products,
  type LocaleTranslation,
} from "@/db/schema";
import {
  CACHE_TAGS,
  PUBLIC_CACHE_REVALIDATE_SECONDS,
} from "@/lib/cache/tags";
import type { Locale } from "@/lib/i18n/config";
import { mediaPublicUrl } from "@/lib/media/public-url";
import { staticAssetUrl } from "@/lib/media/static-asset-url";
import { isDemoSeedEntityId } from "@/db/seed/seed-uuid";

export type StorefrontCategory = {
  id: string;
  title: string;
  slug: string;
  productCount: number;
  imageUrl: string;
};

const CATEGORY_FALLBACK_IMAGES = [
  staticAssetUrl("/assets/categories/soup.webp"),
  staticAssetUrl("/assets/categories/salad.webp"),
  staticAssetUrl("/assets/categories/shawarma.webp"),
  staticAssetUrl("/assets/categories/pizza.webp"),
  staticAssetUrl("/assets/categories/lahmajoun.webp"),
  staticAssetUrl("/assets/categories/khachapuri.webp"),
  staticAssetUrl("/assets/categories/khorovats.webp"),
  staticAssetUrl("/assets/categories/combo.webp"),
] as const;

function translationFor(
  translations: (typeof categories.$inferSelect)["translations"],
  locale: Locale,
): LocaleTranslation | null {
  return translations[locale] ?? translations.hy ?? translations.en ?? null;
}

function fallbackImageForIndex(index: number): string {
  const image = CATEGORY_FALLBACK_IMAGES[index % CATEGORY_FALLBACK_IMAGES.length];
  return image ?? CATEGORY_FALLBACK_IMAGES[0];
}

async function loadStorefrontCategories(
  locale: Locale,
): Promise<StorefrontCategory[]> {
  const rows = await getDb()
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.status, "ACTIVE"),
        isNull(categories.deletedAt),
        isNull(categories.parentId),
      ),
    )
    .orderBy(asc(categories.sortOrder), asc(categories.createdAt));

  // Storefront shows Degusto catalog only. Keep demo/figma seed categories in DB
  // but hide them from customer navigation (reliable ID prefix, not title matching).
  const storefrontRows = rows.filter((row) => !isDemoSeedEntityId(row.id));

  if (storefrontRows.length === 0) {
    return [];
  }

  const categoryIds = storefrontRows.map((row) => row.id);

  const [mediaRows, countRows] = await Promise.all([
    getDb()
      .select({
        categoryId: mediaAssets.categoryId,
        objectKey: mediaAssets.objectKey,
      })
      .from(mediaAssets)
      .where(
        and(
          isNotNull(mediaAssets.categoryId),
          eq(mediaAssets.uploadStatus, "READY"),
          or(
            eq(mediaAssets.isPrimary, true),
            eq(mediaAssets.role, "PRIMARY"),
            eq(mediaAssets.role, "COVER"),
          ),
        ),
      ),
    getDb()
      .select({
        categoryId: productCategories.categoryId,
        productCount: count(products.id),
      })
      .from(productCategories)
      .innerJoin(products, eq(productCategories.productId, products.id))
      .where(
        and(
          inArray(productCategories.categoryId, categoryIds),
          eq(products.status, "ACTIVE"),
          isNull(products.deletedAt),
        ),
      )
      .groupBy(productCategories.categoryId),
  ]);

  const images = new Map<string, string>();
  const categoryIdSet = new Set(categoryIds);
  for (const media of mediaRows) {
    if (!media.categoryId || images.has(media.categoryId)) continue;
    if (!categoryIdSet.has(media.categoryId)) continue;
    images.set(media.categoryId, mediaPublicUrl(media.objectKey));
  }

  const counts = new Map<string, number>();
  for (const row of countRows) {
    counts.set(row.categoryId, Number(row.productCount));
  }

  return storefrontRows.map((row, index) => {
    const translation = translationFor(row.translations, locale);
    return {
      id: row.id,
      title: translation?.title ?? "Untitled",
      slug: translation?.slug ?? "",
      productCount: counts.get(row.id) ?? 0,
      imageUrl: images.get(row.id) ?? fallbackImageForIndex(index),
    };
  });
}

/** Active top-level categories for the storefront home grid. */
export async function listStorefrontCategories(
  locale: Locale,
): Promise<StorefrontCategory[]> {
  return unstable_cache(
    async () => loadStorefrontCategories(locale),
    ["storefront-categories", "degusto-only-v1", locale],
    {
      tags: [CACHE_TAGS.products],
      revalidate: PUBLIC_CACHE_REVALIDATE_SECONDS,
    },
  )();
}

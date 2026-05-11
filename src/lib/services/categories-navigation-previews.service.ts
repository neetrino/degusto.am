import { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import { flattenCategoryTree, type CategoryTreeNode } from "@/lib/categories/category-tree";
import { processImageUrl } from "@/lib/utils/image-utils";
import { categoriesService } from "./categories.service";

const NAV_DISPLAY_LIMIT = 10;

export type CategoryNavPreviewProduct = {
  id: string;
  slug: string;
  title: string;
  image: string | null;
};

type TranslationRow = { locale: string; slug: string; title: string };

function pickTranslation(rows: TranslationRow[], lang: string): TranslationRow | null {
  const preferred = rows.find((r) => r.locale === lang);
  if (preferred) return preferred;
  const en = rows.find((r) => r.locale === "en");
  if (en) return en;
  return rows[0] ?? null;
}

function extractProductImage(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }
  return processImageUrl(media[0] as Parameters<typeof processImageUrl>[0]);
}

/**
 * One representative product per category nav slot (same ordering as CategoryNavigation UI).
 * Replaces N parallel /products calls with a small number of DB queries.
 */
export async function getCategoryNavigationPreviews(
  lang: string
): Promise<Record<string, CategoryNavPreviewProduct | null>> {
  const { data: rootCategories } = await categoriesService.getTree(lang);
  const flat = flattenCategoryTree(rootCategories as CategoryTreeNode[]);

  const slots: Array<{ slug: string; categoryId: string | null }> = [
    { slug: "all", categoryId: null },
    ...flat.map((c) => ({ slug: c.slug, categoryId: c.id })),
  ].slice(0, NAV_DISPLAY_LIMIT);

  const result: Record<string, CategoryNavPreviewProduct | null> = Object.fromEntries(
    slots.map((s) => [s.slug, null])
  ) as Record<string, CategoryNavPreviewProduct | null>;

  const allProduct = await db.product.findFirst({
    where: { published: true, deletedAt: null },
    orderBy: { id: "asc" },
    select: {
      id: true,
      media: true,
      translations: {
        select: { locale: true, slug: true, title: true },
        where: { locale: { in: [lang, "en"] } },
      },
    },
  });

  if (allProduct) {
    const tr = pickTranslation(allProduct.translations, lang);
    const image = extractProductImage(allProduct.media);
    if (tr) {
      result.all = {
        id: allProduct.id,
        slug: tr.slug,
        title: tr.title,
        image,
      };
    }
  }

  const categoryIds = slots
    .map((s) => s.categoryId)
    .filter((id): id is string => id !== null);

  if (categoryIds.length === 0) {
    return result;
  }

  const rows = await db.$queryRaw<Array<{ id: string; primaryCategoryId: string; media: unknown }>>(
    Prisma.sql`
      SELECT DISTINCT ON ("primaryCategoryId")
        id,
        "primaryCategoryId",
        media
      FROM products
      WHERE published = true
        AND "deletedAt" IS NULL
        AND "primaryCategoryId" IN (${Prisma.join(categoryIds)})
      ORDER BY "primaryCategoryId", id ASC
    `
  );

  if (rows.length === 0) {
    return result;
  }

  const productIds = rows.map((r) => r.id);
  const translations = await db.productTranslation.findMany({
    where: {
      productId: { in: productIds },
      locale: { in: [lang, "en"] },
    },
    select: { productId: true, locale: true, slug: true, title: true },
  });

  const byProduct = new Map<string, TranslationRow[]>();
  for (const row of translations) {
    const list = byProduct.get(row.productId) ?? [];
    list.push({ locale: row.locale, slug: row.slug, title: row.title });
    byProduct.set(row.productId, list);
  }

  const slugByCategoryId = new Map(
    slots.filter((s) => s.categoryId).map((s) => [s.categoryId!, s.slug])
  );

  for (const row of rows) {
    const navSlug = slugByCategoryId.get(row.primaryCategoryId);
    if (!navSlug) continue;
    const tr = pickTranslation(byProduct.get(row.id) ?? [], lang);
    if (!tr) continue;
    result[navSlug] = {
      id: row.id,
      slug: tr.slug,
      title: tr.title,
      image: extractProductImage(row.media),
    };
  }

  return result;
}

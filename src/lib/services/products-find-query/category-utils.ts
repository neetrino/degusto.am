import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";

/**
 * Get all child category IDs with iterative traversal to avoid N+1 recursion.
 */
export async function getAllChildCategoryIds(parentId: string): Promise<string[]> {
  const rows = await db.category.findMany({
    where: {
      published: true,
      deletedAt: null,
    },
    select: { id: true, parentId: true },
  });

  if (rows.length === 0) {
    return [];
  }

  const childrenByParent = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.parentId) {
      continue;
    }
    const next = childrenByParent.get(row.parentId);
    if (next) {
      next.push(row.id);
      continue;
    }
    childrenByParent.set(row.parentId, [row.id]);
  }

  const queue: string[] = [...(childrenByParent.get(parentId) ?? [])];
  const result: string[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }
    result.push(currentId);
    const nested = childrenByParent.get(currentId);
    if (nested && nested.length > 0) {
      queue.push(...nested);
    }
  }

  return result;
}

/**
 * Find category by slug with fallback to other languages
 */
export async function findCategoryBySlug(
  categorySlug: string,
  lang: string
): Promise<{ id: string } | null> {
  logger.debug('Looking for category', { category: categorySlug, lang });
  
  let categoryDoc = await db.category.findFirst({
    where: {
      translations: {
        some: {
          slug: categorySlug,
          locale: lang,
        },
      },
      published: true,
      deletedAt: null,
    },
  });

  // If category not found in current language, try to find it in other languages (fallback)
  if (!categoryDoc) {
    logger.warn('Category not found in language, trying other languages', { category: categorySlug, lang });
    categoryDoc = await db.category.findFirst({
      where: {
        translations: {
          some: {
            slug: categorySlug,
          },
        },
        published: true,
        deletedAt: null,
      },
      include: { translations: true },
    });
    
    if (categoryDoc) {
      const foundIn = (categoryDoc as { translations?: Array<{ slug: string; locale: string }> }).translations?.find((t: { slug: string; locale: string }) => t.slug === categorySlug)?.locale || 'unknown';
      logger.info('Category found in different language', { 
        id: categoryDoc.id, 
        slug: categorySlug,
        foundIn
      });
    }
  }

  if (categoryDoc) {
    logger.info('Category found', { id: categoryDoc.id, slug: categorySlug });
  } else {
    logger.warn('Category not found in any language', { category: categorySlug, lang });
  }

  return categoryDoc;
}





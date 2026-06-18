import { db } from "@white-shop/db";
import { logger } from "../../utils/logger";

/**
 * Subcategories are disabled in this project; keep filters flat.
 */
export async function getAllChildCategoryIds(parentId: string): Promise<string[]> {
  void parentId;
  return [];
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





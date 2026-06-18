import { db } from "@white-shop/db";
import { revalidateStorefrontMenuCaches } from "@/lib/cache/revalidate-storefront-menu-caches";
import { invalidateStorefrontCategoryCaches } from "@/lib/cache/storefront-cache";
import { problemTypes } from "@/lib/http/problem-details";
import { toSlug } from "@/lib/utils/slug";
import { logger } from "@/lib/utils/logger";
import { pickLocaleTranslation } from "@/lib/utils/pick-locale-translation";

class AdminCategoriesService {
  private async revalidateStorefrontAfterCategoryChange(): Promise<void> {
    try {
      revalidateStorefrontMenuCaches();
      await invalidateStorefrontCategoryCaches();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn("Category cache revalidation failed (expected in some environments)", {
        error: errorMessage,
      });
    }
  }

  private async getNextCategoryPosition(): Promise<number> {
    const aggregate = await db.category.aggregate({
      where: {
        deletedAt: null,
      },
      _max: {
        position: true,
      },
    });

    return (aggregate._max.position ?? -1) + 1;
  }

  private extractImageUrl(media: unknown): string | null {
    if (!Array.isArray(media)) {
      return null;
    }

    const firstItem = media[0];
    if (!firstItem || typeof firstItem !== "object") {
      return null;
    }

    const url = (firstItem as { url?: unknown }).url;
    return typeof url === "string" ? url : null;
  }

  private async detachCategoryFromProducts(categoryId: string): Promise<void> {
    const linkedProducts = await db.product.findMany({
      where: {
        OR: [
          { primaryCategoryId: categoryId },
          { categoryIds: { has: categoryId } },
        ],
      },
      select: {
        id: true,
        categoryIds: true,
      },
    });

    if (linkedProducts.length === 0) {
      return;
    }

    await db.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { primaryCategoryId: categoryId },
        data: { primaryCategoryId: null },
      });

      for (const product of linkedProducts) {
        if (!product.categoryIds.includes(categoryId)) {
          continue;
        }

        const nextCategoryIds = product.categoryIds.filter((id) => id !== categoryId);
        await tx.product.update({
          where: { id: product.id },
          data: { categoryIds: nextCategoryIds },
        });
      }

      await tx.category.update({
        where: { id: categoryId },
        data: {
          products: {
            set: [],
          },
        },
      });
    });
  }

  /**
   * Get categories for admin
   */
  async getCategories(preferredLocale = "hy") {
    const categories = await db.category.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        translations: true,
      },
      orderBy: {
        position: "asc",
      },
    });
    const products = await db.product.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        primaryCategoryId: true,
        categoryIds: true,
      },
    });

    const categoryProductIds = new Map<string, Set<string>>();
    for (const product of products) {
      const linkedCategoryIds = new Set<string>();
      if (typeof product.primaryCategoryId === "string" && product.primaryCategoryId.length > 0) {
        linkedCategoryIds.add(product.primaryCategoryId);
      }
      for (const categoryId of product.categoryIds) {
        linkedCategoryIds.add(categoryId);
      }
      for (const categoryId of linkedCategoryIds) {
        const existing = categoryProductIds.get(categoryId);
        if (existing) {
          existing.add(product.id);
        } else {
          categoryProductIds.set(categoryId, new Set([product.id]));
        }
      }
    }

    return {
      data: categories.map((category: { id: string; position: number; requiresSizes: boolean | null; published: boolean | null; media: unknown[]; translations?: Array<{ locale: string; title: string; slug: string }> }) => {
        const translations = Array.isArray(category.translations) ? category.translations : [];
        const translation = pickLocaleTranslation(translations, preferredLocale);
        return {
          id: category.id,
          title: translation?.title || translation?.slug || "",
          slug: translation?.slug || "",
          parentId: null,
          position: category.position,
          productsCount: categoryProductIds.get(category.id)?.size ?? 0,
          requiresSizes: category.requiresSizes || false,
          published: Boolean(category.published),
          imageUrl: this.extractImageUrl(category.media),
        };
      }),
    };
  }

  /**
   * Reorder categories as a flat list.
   */
  async reorderCategories(data: { orderedIds: string[] }) {
    const { orderedIds } = data;

    const categories = await db.category.findMany({
      where: { deletedAt: null },
      select: { id: true },
      orderBy: { position: "asc" },
    });

    const existingIds = categories.map((category) => category.id);
    const orderedIdSet = new Set(orderedIds);

    if (existingIds.length !== orderedIds.length) {
      throw {
        status: 400,
        type: problemTypes.badRequest,
        title: "Invalid reorder payload",
        detail: "orderedIds must include every category exactly once",
      };
    }

    if (!existingIds.every((id) => orderedIdSet.has(id))) {
      throw {
        status: 400,
        type: problemTypes.badRequest,
        title: "Invalid reorder payload",
        detail: "orderedIds must only contain existing category IDs",
      };
    }

    await db.$transaction(
      orderedIds.map((id, index) =>
        db.category.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );

    void this.revalidateStorefrontAfterCategoryChange();

    return { success: true };
  }

  /**
   * Create category
   */
  async createCategory(data: {
    title: string;
    locale?: string;
    requiresSizes?: boolean;
    imageUrl?: string;
    published?: boolean;
  }) {
    const locale = data.locale || "en";
    
    // Generate slug from title (ReDoS-safe)
    const slug = toSlug(data.title);

    const nextPosition = await this.getNextCategoryPosition();

    const category = await db.category.create({
      data: {
        parentId: null,
        position: nextPosition,
        requiresSizes: data.requiresSizes || false,
        published: data.published ?? true,
        media: data.imageUrl
          ? [{ type: "image", url: data.imageUrl }]
          : [],
        translations: {
          create: {
            locale,
            title: data.title,
            slug,
            fullPath: slug, // Can be enhanced to build full path
          },
        },
      },
      include: {
        translations: true,
      },
    });

    // Безопасное получение translation с проверкой на существование массива
    const categoryTranslations = Array.isArray(category.translations) ? category.translations : [];
    const translation = categoryTranslations.find((t: { locale: string }) => t.locale === locale) || categoryTranslations[0] || null;

    await this.revalidateStorefrontAfterCategoryChange();

    return {
      data: {
        id: category.id,
        title: translation?.title || "",
        slug: translation?.slug || "",
        parentId: null,
        requiresSizes: category.requiresSizes || false,
        imageUrl: this.extractImageUrl(category.media),
        published: Boolean(category.published),
      },
    };
  }

  /**
   * Get category by ID with children
   */
  async getCategoryById(categoryId: string) {
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        translations: true,
      },
    });

    if (!category) {
      return null;
    }

    const translations = Array.isArray(category.translations) ? category.translations : [];
    const translation = translations[0] || null;
    const localeTranslations = translations.reduce<Partial<Record<"hy" | "en" | "ru", string>>>((acc, entry) => {
      if (entry.locale === "hy" || entry.locale === "en" || entry.locale === "ru") {
        acc[entry.locale] = entry.title;
      }
      return acc;
    }, {});

    return {
      id: category.id,
      title: translation?.title || "",
      slug: translation?.slug || "",
      parentId: null,
      requiresSizes: category.requiresSizes || false,
      published: Boolean(category.published),
      imageUrl: this.extractImageUrl(category.media),
      translations: localeTranslations,
    };
  }

  /**
   * Update category
   */
  async updateCategory(categoryId: string, data: {
    title?: string;
    locale?: string;
    requiresSizes?: boolean;
    imageUrl?: string | null;
    published?: boolean;
  }) {
    const locale = data.locale || "en";
    
    const category = await db.category.findUnique({
      where: { id: categoryId },
      include: {
        translations: true,
      },
    });

    if (!category) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Category not found",
        detail: `Category with id '${categoryId}' does not exist`,
      };
    }

    const updateData: {
      parentId?: null;
      requiresSizes?: boolean;
      published?: boolean;
      media?: Array<{ type: string; url: string }>;
    } = {
      // Keep categories flat globally.
      parentId: null,
    };
    
    if (data.requiresSizes !== undefined) {
      updateData.requiresSizes = data.requiresSizes;
    }

    if (data.published !== undefined) {
      updateData.published = data.published;
    }

    if (data.imageUrl !== undefined) {
      updateData.media = data.imageUrl
        ? [{ type: "image", url: data.imageUrl }]
        : [];
    }

    // Update translation if title is provided
    if (data.title) {
      const slug = toSlug(data.title);

      const categoryTranslations = Array.isArray(category.translations) ? category.translations : [];
      const existingTranslation = categoryTranslations.find((t: { locale: string }) => t.locale === locale);

      if (existingTranslation) {
        // Update existing translation
        await db.categoryTranslation.update({
          where: { id: existingTranslation.id },
          data: {
            title: data.title,
            slug,
          },
        });
      } else {
        // Create new translation
        await db.categoryTranslation.create({
          data: {
            categoryId: category.id,
            locale,
            title: data.title,
            slug,
            fullPath: slug,
          },
        });
      }
    }

    // Update category base data
    const updatedCategory = await db.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        translations: true,
      },
    });

    const categoryTranslations = Array.isArray(updatedCategory.translations) ? updatedCategory.translations : [];
    const translation = categoryTranslations.find((t: { locale: string }) => t.locale === locale) || categoryTranslations[0] || null;

    await this.revalidateStorefrontAfterCategoryChange();

    return {
      data: {
        id: updatedCategory.id,
        title: translation?.title || "",
        slug: translation?.slug || "",
        parentId: null,
        requiresSizes: updatedCategory.requiresSizes || false,
        published: Boolean(updatedCategory.published),
        imageUrl: this.extractImageUrl(updatedCategory.media),
      },
    };
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId: string) {
    logger.debug('🗑️ [ADMIN SERVICE] deleteCategory called:', categoryId);
    
    const category = await db.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Category not found",
        detail: `Category with id '${categoryId}' does not exist`,
      };
    }

    await this.detachCategoryFromProducts(categoryId);

    await db.category.update({
      where: { id: categoryId },
      data: {
        deletedAt: new Date(),
        published: false,
      },
    });

    await this.revalidateStorefrontAfterCategoryChange();

    logger.debug('✅ [ADMIN SERVICE] Category deleted:', categoryId);
    return { success: true };
  }
}

export const adminCategoriesService = new AdminCategoriesService();




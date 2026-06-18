import { db } from "@white-shop/db";

import { problemTypes } from "@/lib/http/problem-details";

export type HomeRootCategoryItem = {
  id: string;
  slug: string;
  title: string;
};

class CategoriesService {
  /**
   * Get category tree
   */
  async getTree(lang: string = "en") {
    const categories = await db.category.findMany({
      where: {
        published: true,
        deletedAt: null,
      },
      include: {
        translations: true,
        children: {
          include: {
            translations: true,
          },
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    const flatCategories = categories
      .map((category: {
        id: string;
        translations: Array<{ locale: string; slug: string; title: string; fullPath: string }>;
      }) => {
      const translation =
        category.translations.find((t: { locale: string }) => t.locale === lang) ||
        category.translations[0];
      if (!translation) return null;

      return {
        id: category.id,
        slug: translation.slug,
        title: translation.title,
        fullPath: translation.fullPath,
      };
    })
      .filter((category): category is { id: string; slug: string; title: string; fullPath: string } => Boolean(category));

    return {
      data: flatCategories,
    };
  }

  /**
   * Published categories for the home page.
   */
  async getHomeRootCategories(lang: string, limit: number): Promise<HomeRootCategoryItem[]> {
    const categories = await db.category.findMany({
      where: {
        published: true,
        deletedAt: null,
      },
      orderBy: {
        position: "asc",
      },
      take: limit,
      select: {
        id: true,
        translations: {
          where: {
            locale: {
              in: [lang, "en"],
            },
          },
          select: {
            locale: true,
            slug: true,
            title: true,
          },
        },
      },
    });

    const result: HomeRootCategoryItem[] = [];
    for (const category of categories) {
      const translation =
        category.translations.find((entry) => entry.locale === lang) ?? category.translations[0];
      if (!translation) {
        continue;
      }
      result.push({
        id: category.id,
        slug: translation.slug,
        title: translation.title,
      });
    }
    return result;
  }

  /**
   * Get category by slug
   */
  async findBySlug(slug: string, lang: string = "en") {
    const category = await db.category.findFirst({
      where: {
        translations: {
          some: {
            slug,
            locale: lang,
          },
        },
        published: true,
        deletedAt: null,
      },
      include: {
        translations: true,
        parent: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!category) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Category not found",
        detail: `Category with slug '${slug}' does not exist or is not published`,
      };
    }

    const translation =
      category.translations.find((t: { locale: string }) => t.locale === lang) ||
      category.translations[0];
    const parentTranslation = category.parent
      ? category.parent.translations.find((t: { locale: string }) => t.locale === lang) ||
        category.parent.translations[0]
      : null;

    return {
      id: category.id,
      slug: translation?.slug || "",
      title: translation?.title || "",
      description: translation?.description || null,
      fullPath: translation?.fullPath || "",
      seo: {
        title: translation?.seoTitle || translation?.title,
        description: translation?.seoDescription || null,
      },
      parent: category.parent
        ? {
            id: category.parent.id,
            slug: parentTranslation?.slug || "",
            title: parentTranslation?.title || "",
          }
        : null,
    };
  }
}

export const categoriesService = new CategoriesService();


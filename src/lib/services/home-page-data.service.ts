import { unstable_cache } from 'next/cache';
import { categoriesService } from '@/lib/services/categories.service';
import type { HomeCategoryItem, HomeFeaturedProduct } from '@/components/home/FigmaHomePage';
import { db } from '@white-shop/db';
import { Prisma } from '@prisma/client';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { withPrismaResilience } from '@/lib/db/with-prisma-resilience';
import { resolveFoodAttributeFlagsFromVariants } from '@/lib/product-food-attributes';
import { r2Asset } from '@/lib/r2-public-url';

/** Shared cache tag for `revalidateTag` on product/category admin writes. */
export const HOME_PAGE_CACHE_TAG = 'home';

export const HOME_PAGE_REVALIDATE_SECONDS = 60;

const HOME_FEATURED_PRODUCTS_LIMIT = 12;
const HOME_CATEGORIES_LIMIT = 8;

type CategoryTreeItem = {
  id: string;
  slug: string;
  title: string;
  children: CategoryTreeItem[];
};

export type HomePageData = {
  featuredProducts: HomeFeaturedProduct[];
  categories: HomeCategoryItem[];
};

function getHomeProductSelect(homeLang: StorefrontLocale) {
  return {
    id: true,
    media: true,
    discountPercent: true,
    translations: {
      where: {
        locale: {
          in: [homeLang, 'en'],
        },
      },
      select: {
        locale: true,
        slug: true,
        title: true,
      },
    },
    categories: {
      take: 1,
      select: {
        translations: {
          where: {
            locale: {
              in: [homeLang, 'en'],
            },
          },
          select: {
            locale: true,
            title: true,
          },
        },
      },
    },
    variants: {
      where: {
        published: true,
      },
      orderBy: {
        price: 'asc' as const,
      },
      select: {
        id: true,
        published: true,
        price: true,
        compareAtPrice: true,
        /** Spicy/greens badges use JSON buckets only on home (see product-food-attributes). */
        attributes: true,
      },
    },
  };
}

function flattenCategoryTree(items: CategoryTreeItem[]): CategoryTreeItem[] {
  const flattened: CategoryTreeItem[] = [];
  for (const item of items) {
    flattened.push(item);
    if (item.children.length > 0) {
      flattened.push(...flattenCategoryTree(item.children));
    }
  }
  return flattened;
}

function toPositiveNumber(value: number | null | undefined): number | null {
  if (typeof value !== 'number') {
    return null;
  }
  return Number.isFinite(value) && value > 0 ? value : null;
}

function toCountNumber(value: unknown): number {
  if (typeof value === 'bigint') {
    return Number(value);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }
  return 0;
}

function resolveCategoryCardImage(index: number): string {
  if (index % 4 === 0) {
    return r2Asset('category/20260512-27SeUi_ujs.png');
  }
  if (index % 4 === 1) {
    return r2Asset('category/20260512-Np6RG2GuNi.png');
  }
  if (index % 4 === 2) {
    return r2Asset('category/20260512-UOlekxqQyh.png');
  }
  return r2Asset('category/20260512-j5QKmShMEM.png');
}

/**
 * Loads home featured products and category blocks from the database (uncached).
 */
export async function loadHomePageData(homeLang: StorefrontLocale): Promise<HomePageData> {
  const homeProductSelect = getHomeProductSelect(homeLang);

  const [selectedRows, promoRows, categoriesTreeResult] = await Promise.all([
    withPrismaResilience(
      () =>
        db.product.findMany({
          where: {
            published: true,
            deletedAt: null,
            featured: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: HOME_FEATURED_PRODUCTS_LIMIT,
          select: homeProductSelect,
        }),
      [],
      'HOME',
      'home featured products'
    ),
    withPrismaResilience(
      () =>
        db.product.findMany({
          where: {
            published: true,
            deletedAt: null,
            discountPercent: {
              gt: 0,
            },
          },
          orderBy: {
            discountPercent: 'desc',
          },
          take: HOME_FEATURED_PRODUCTS_LIMIT,
          select: homeProductSelect,
        }),
      [],
      'HOME',
      'home promo products'
    ),
    withPrismaResilience(
      () => categoriesService.getTree(homeLang),
      { data: [] as CategoryTreeItem[] },
      'HOME',
      'home categories tree'
    ),
  ]);

  const selectedProductIds = new Set(selectedRows.map((product) => product.id));
  const selectedPromoRows = promoRows.filter((product) => !selectedProductIds.has(product.id));
  const homeRows = [...selectedRows, ...selectedPromoRows].slice(0, HOME_FEATURED_PRODUCTS_LIMIT);

  const featuredProducts: HomeFeaturedProduct[] = homeRows.map((product) => {
    const preferredTranslation =
      product.translations.find((translation) => translation.locale === homeLang) ??
      product.translations[0];
    const firstCategory = product.categories[0];
    const preferredCategoryTranslation =
      firstCategory?.translations.find((translation) => translation.locale === homeLang) ??
      firstCategory?.translations[0];
    const mainVariant = product.variants[0];
    const foodAttrs = resolveFoodAttributeFlagsFromVariants(product.variants);
    const imageUrlRaw = Array.isArray(product.media) && product.media.length > 0 ? product.media[0] : null;
    const image =
      imageUrlRaw && typeof imageUrlRaw === 'object' && 'url' in imageUrlRaw
        ? String(imageUrlRaw.url)
        : typeof imageUrlRaw === 'string'
          ? imageUrlRaw
          : null;

    return {
      id: product.id,
      slug: preferredTranslation?.slug || 'products',
      title: preferredTranslation?.title || 'Product',
      subtitle: preferredCategoryTranslation?.title || 'Կատեգորիա',
      price: toPositiveNumber(mainVariant?.price),
      oldPrice: toPositiveNumber(mainVariant?.compareAtPrice),
      image,
      discountPercent: toPositiveNumber(product.discountPercent),
      inStock: mainVariant?.published ?? true,
      defaultVariantId: mainVariant?.id ?? null,
      supportsSpicy: foodAttrs.supportsSpicy,
      supportsGreens: foodAttrs.supportsGreens,
    };
  });

  const flatCategories = flattenCategoryTree((categoriesTreeResult.data as CategoryTreeItem[]) ?? []);
  const selectedCategories = flatCategories.slice(0, HOME_CATEGORIES_LIMIT);
  const selectedCategoryIds = selectedCategories.map((category) => category.id);

  const categoryTotals =
    selectedCategoryIds.length === 0
      ? []
      : await withPrismaResilience(
          () =>
            db.$queryRaw<Array<{ primaryCategoryId: string; total: unknown }>>(
              Prisma.sql`
                SELECT "primaryCategoryId", COUNT(*) AS total
                FROM products
                WHERE published = true
                  AND "deletedAt" IS NULL
                  AND "primaryCategoryId" IN (${Prisma.join(selectedCategoryIds)})
                GROUP BY "primaryCategoryId"
              `
            ),
          [],
          'HOME',
          'home category totals'
        );

  const categoryTotalMap = new Map(
    categoryTotals.map((item) => [item.primaryCategoryId, toCountNumber(item.total)])
  );
  const categories: HomeCategoryItem[] = selectedCategories.map((category, index) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
    count: categoryTotalMap.get(category.id) ?? 0,
    image: resolveCategoryCardImage(index),
  }));

  return { featuredProducts, categories };
}

const getHomePageDataCached = unstable_cache(
  async (homeLang: StorefrontLocale) => loadHomePageData(homeLang),
  ['home-page-data-v3'],
  {
    revalidate: HOME_PAGE_REVALIDATE_SECONDS,
    tags: [HOME_PAGE_CACHE_TAG],
  }
);

/**
 * Home page payload with per-locale Data Cache (60s TTL, invalidated via `HOME_PAGE_CACHE_TAG`).
 */
export function getHomePageData(homeLang: StorefrontLocale): Promise<HomePageData> {
  return getHomePageDataCached(homeLang);
}

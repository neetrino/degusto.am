import { categoriesService } from '@/lib/services/categories.service';
import { FigmaHomePage, type HomeCategoryItem, type HomeFeaturedProduct } from '../components/home/FigmaHomePage';
import { db } from '@white-shop/db';
import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers';
import { resolveStorefrontLocaleFromCookie, type StorefrontLocale } from '@/lib/i18n/locale';
import { logger } from '@/lib/utils/logger';

type CategoryTreeItem = {
  id: string;
  slug: string;
  title: string;
  children: CategoryTreeItem[];
};

const HOME_FEATURED_PRODUCTS_LIMIT = 5;
const HOME_CATEGORIES_LIMIT = 8;
const HOME_DB_RETRY_ATTEMPTS = 2;
const HOME_DB_RETRY_DELAY_MS = 150;
export const revalidate = 1800;

function isPrismaPoolTimeout(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2024';
}

async function withPrismaPoolRetry<T>(operation: () => Promise<T>, fallback: T, operationName: string): Promise<T> {
  for (let attempt = 0; attempt <= HOME_DB_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error: unknown) {
      if (!isPrismaPoolTimeout(error)) {
        throw error;
      }
      const isLastAttempt = attempt === HOME_DB_RETRY_ATTEMPTS;
      logger.warn(`[HOME] Prisma connection pool timeout in ${operationName}`, {
        attempt: attempt + 1,
        maxAttempts: HOME_DB_RETRY_ATTEMPTS + 1,
      });
      if (isLastAttempt) {
        logger.error(`[HOME] Falling back after repeated pool timeouts in ${operationName}`, { error });
        return fallback;
      }
      await new Promise((resolve) => setTimeout(resolve, HOME_DB_RETRY_DELAY_MS * (attempt + 1)));
    }
  }

  return fallback;
}

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
      take: 1,
      select: {
        price: true,
        compareAtPrice: true,
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

export default async function HomePage() {
  const cookieStore = await cookies();
  const homeLang = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const homeProductSelect = getHomeProductSelect(homeLang);

  const selectedRows = await withPrismaPoolRetry(
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
    'home featured products'
  );

  const promoRows = await withPrismaPoolRetry(
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
      take: HOME_FEATURED_PRODUCTS_LIMIT * 2,
      select: homeProductSelect,
    }),
    [],
    'home promo products'
  );

  const categoriesTreeResult = await withPrismaPoolRetry(
    () => categoriesService.getTree(homeLang),
    { data: [] as CategoryTreeItem[] },
    'home categories tree'
  );

  const selectedProductIds = new Set(selectedRows.map((product) => product.id));
  const selectedPromoRows = promoRows.filter((product) => !selectedProductIds.has(product.id));
  const homeRows = [...selectedRows, ...selectedPromoRows].slice(0, HOME_FEATURED_PRODUCTS_LIMIT);

  const featuredProducts: HomeFeaturedProduct[] = homeRows.map((product) => {
    const preferredTranslation =
      product.translations.find((translation) => translation.locale === homeLang) ?? product.translations[0];
    const firstCategory = product.categories[0];
    const preferredCategoryTranslation =
      firstCategory?.translations.find((translation) => translation.locale === homeLang) ??
      firstCategory?.translations[0];
    const mainVariant = product.variants[0];
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
    };
  });

  const flatCategories = flattenCategoryTree((categoriesTreeResult.data as CategoryTreeItem[]) ?? []);
  const selectedCategories = flatCategories.slice(0, HOME_CATEGORIES_LIMIT);
  const selectedCategoryIds = selectedCategories.map((category) => category.id);

  const categoryTotals =
    selectedCategoryIds.length === 0
      ? []
      : await withPrismaPoolRetry(
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
          'home category totals'
        );

  const categoryTotalMap = new Map(categoryTotals.map((item) => [item.primaryCategoryId, toCountNumber(item.total)]));
  const homeCategories: HomeCategoryItem[] = selectedCategories.map((category, index) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
    count: categoryTotalMap.get(category.id) ?? 0,
    image:
      index % 4 === 0
        ? '/api/r2/category/20260512-27SeUi_ujs.png'
        : index % 4 === 1
          ? '/api/r2/category/20260512-Np6RG2GuNi.png'
          : index % 4 === 2
            ? '/api/r2/category/20260512-UOlekxqQyh.png'
            : '/api/r2/category/20260512-j5QKmShMEM.png',
  }));

  return <FigmaHomePage featuredProducts={featuredProducts} categories={homeCategories} />;
}

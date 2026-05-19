import { storefrontAmdPriceBoundToVariantUsd } from '@/lib/currency';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { buildProductWhereTasteCapability } from '@/lib/product-food-attributes';
import type { Prisma } from '@prisma/client';
import type { ShopMenuQuery } from './shop-page-query.types';

const COMBO_EXCLUSION_CATEGORY_FILTER = {
  categories: {
    none: {
      translations: {
        some: {
          locale: 'en',
          slug: 'combo',
        },
      },
    },
  },
} as const;

export function buildShopProductWhereBase(
  locale: StorefrontLocale,
  query: ShopMenuQuery
): Prisma.ProductWhereInput {
  const minPriceUsd =
    query.minPriceAmd !== null ? storefrontAmdPriceBoundToVariantUsd(query.minPriceAmd) : null;
  const maxPriceUsd =
    query.maxPriceAmd !== null ? storefrontAmdPriceBoundToVariantUsd(query.maxPriceAmd) : null;

  return {
    published: true,
    deletedAt: null,
    ...COMBO_EXCLUSION_CATEGORY_FILTER,
    ...(query.selectedSearchQuery
      ? {
          translations: {
            some: {
              locale: { in: [query.locale, 'en'] },
              OR: [
                {
                  title: {
                    contains: query.selectedSearchQuery,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  subtitle: {
                    contains: query.selectedSearchQuery,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            },
          },
        }
      : {}),
    ...(minPriceUsd !== null || maxPriceUsd !== null
      ? {
          variants: {
            some: {
              published: true,
              ...(minPriceUsd !== null ? { price: { gte: minPriceUsd } } : {}),
              ...(maxPriceUsd !== null ? { price: { lte: maxPriceUsd } } : {}),
            },
          },
        }
      : {}),
    ...(query.tasteFilter ? buildProductWhereTasteCapability(query.tasteFilter) : {}),
  };
}

export function buildShopProductWhere(
  locale: StorefrontLocale,
  query: ShopMenuQuery,
  productWhereBase: Prisma.ProductWhereInput
): Prisma.ProductWhereInput {
  if (!query.selectedCategorySlug) {
    return productWhereBase;
  }

  return {
    AND: [
      productWhereBase,
      {
        categories: {
          some: {
            deletedAt: null,
            published: true,
            translations: {
              some: {
                locale: { in: [locale, 'en'] },
                slug: query.selectedCategorySlug,
              },
            },
          },
        },
      },
    ],
  };
}

export function getShopProductSelect(locale: StorefrontLocale): Prisma.ProductSelect {
  const localeFilter = { in: [locale, 'en'] };

  return {
    id: true,
    media: true,
    discountPercent: true,
    categories: {
      where: {
        deletedAt: null,
        published: true,
      },
      orderBy: {
        position: 'asc',
      },
      take: 1,
      select: {
        translations: {
          where: {
            locale: localeFilter,
          },
          select: {
            locale: true,
            title: true,
            slug: true,
          },
        },
      },
    },
    translations: {
      where: {
        locale: localeFilter,
      },
      select: {
        locale: true,
        title: true,
        subtitle: true,
        slug: true,
      },
    },
    variants: {
      where: {
        published: true,
      },
      orderBy: {
        price: 'asc',
      },
      select: {
        published: true,
        price: true,
        compareAtPrice: true,
        /** Spicy/greens badges use JSON buckets only (see product-food-attributes). */
        attributes: true,
      },
    },
  };
}

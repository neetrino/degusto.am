import type { StorefrontLocale } from '@/lib/i18n/locale';
import { getStorefrontCategorySlugCandidates } from '@/constants/storefront-all-category-slug';
import type { Prisma } from '@prisma/client';
import { SHOP_MENU_FAST_VARIANT_SAMPLE_SIZE } from '@/constants/shop-menu-perf';
import { buildMenuProductWhereBase } from '../menu-page/menu-page-product-where-base';
import type { ShopMenuQuery } from './shop-page-query.types';

type ShopProductSelectOptions = {
  menuFast?: boolean;
};

export function buildShopProductWhereBase(
  locale: StorefrontLocale,
  query: ShopMenuQuery
): Prisma.ProductWhereInput {
  return buildMenuProductWhereBase(locale, query, 'exclude');
}

export function buildShopProductWhere(
  locale: StorefrontLocale,
  query: ShopMenuQuery,
  productWhereBase: Prisma.ProductWhereInput,
  selectedCategoryIds: string[] = []
): Prisma.ProductWhereInput {
  const selectedCategorySlugs = getStorefrontCategorySlugCandidates(query.selectedCategorySlug);
  if (selectedCategorySlugs.length === 0) {
    return productWhereBase;
  }

  const categorySlugFilter: Prisma.ProductWhereInput = {
    categories: {
      some: {
        deletedAt: null,
        published: true,
        translations: {
          some: {
            locale: { in: [locale, 'en'] },
            slug: { in: selectedCategorySlugs },
          },
        },
      },
    },
  };
  const categoryIdBackfillFilter: Prisma.ProductWhereInput[] =
    selectedCategoryIds.length > 0
      ? [
          { primaryCategoryId: { in: selectedCategoryIds } },
          { categoryIds: { hasSome: selectedCategoryIds } },
        ]
      : [];

  return {
    AND: [
      productWhereBase,
      {
        OR: [categorySlugFilter, ...categoryIdBackfillFilter],
      },
    ],
  };
}

export function getShopProductSelect(
  locale: StorefrontLocale,
  options?: ShopProductSelectOptions
): Prisma.ProductSelect {
  const localeFilter = { in: [locale, 'en'] };
  const menuFast = options?.menuFast === true;

  return {
    id: true,
    discountPercent: true,
    media: true,
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
      select: menuFast
        ? {
            locale: true,
            title: true,
            slug: true,
          }
        : {
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
      ...(menuFast ? { take: SHOP_MENU_FAST_VARIANT_SAMPLE_SIZE } : {}),
      select: menuFast
        ? {
            id: true,
            price: true,
            compareAtPrice: true,
            stock: true,
            attributes: true,
          }
        : {
            id: true,
            published: true,
            price: true,
            compareAtPrice: true,
            stock: true,
            attributes: true,
          },
    },
    _count: {
      select: {
        variants: {
          where: {
            published: true,
          },
        },
        ...(menuFast
          ? {}
          : {
              reviews: {
                where: {
                  published: true,
                },
              },
            }),
      },
    },
  };
}

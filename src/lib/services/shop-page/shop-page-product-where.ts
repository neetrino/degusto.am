import type { StorefrontLocale } from '@/lib/i18n/locale';
import { buildProductWhereTasteCapability } from '@/lib/product-food-attributes';
import {
  buildPublishedVariantPriceSomeWhere,
  resolveVariantUsdBoundsFromAmd,
} from '@/lib/storefront/variant-price-filter';
import type { Prisma } from '@prisma/client';
import { SHOP_MENU_FAST_VARIANT_SAMPLE_SIZE } from '@/constants/shop-menu-perf';
import type { ShopMenuQuery } from './shop-page-query.types';

type ShopProductSelectOptions = {
  menuFast?: boolean;
};

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
  const variantPriceSome = buildPublishedVariantPriceSomeWhere(
    resolveVariantUsdBoundsFromAmd(query.minPriceAmd, query.maxPriceAmd)
  );

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
    ...(variantPriceSome ? { variants: { some: variantPriceSome } } : {}),
    ...(query.tasteFilter ? buildProductWhereTasteCapability(query.tasteFilter) : {}),
  };
}

export function buildShopProductWhere(
  locale: StorefrontLocale,
  query: ShopMenuQuery,
  productWhereBase: Prisma.ProductWhereInput,
  selectedCategoryIds: string[] = []
): Prisma.ProductWhereInput {
  if (!query.selectedCategorySlug) {
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
            slug: query.selectedCategorySlug,
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
      ...(menuFast ? { take: SHOP_MENU_FAST_VARIANT_SAMPLE_SIZE } : {}),
      select: {
        id: true,
        published: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        /** Spicy/greens badges need published variant attributes (see product-food-attributes). */
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

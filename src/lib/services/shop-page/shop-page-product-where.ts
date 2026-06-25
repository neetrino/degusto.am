import type { StorefrontLocale } from '@/lib/i18n/locale';
import { buildProductWhereTasteCapability } from '@/lib/product-food-attributes';
import {
  buildPublishedVariantPriceSomeWhere,
  resolveVariantUsdBoundsFromAmd,
} from '@/lib/storefront/variant-price-filter';
import type { Prisma } from '@prisma/client';
import type { ShopMenuQuery } from './shop-page-query.types';
import { getShopMenuProductSelect } from './shop-menu-product-select';

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

/** @deprecated Prefer `getShopMenuProductSelect` — kept for existing imports. */
export function getShopProductSelect(locale: StorefrontLocale): Prisma.ProductSelect {
  return getShopMenuProductSelect(locale);
}

import type { StorefrontLocale } from '@/lib/i18n/locale';
import { buildProductWhereTasteCapability } from '@/lib/product-food-attributes';
import {
  buildPublishedVariantPriceSomeWhere,
  resolveVariantUsdBoundsFromAmd,
} from '@/lib/storefront/variant-price-filter';
import type { Prisma } from '@prisma/client';
import type { ComboMenuQuery } from './combo-page-query.types';
import { getShopProductSelect } from '../shop-page/shop-page-product-where';

const COMBO_ONLY_CATEGORY_FILTER = {
  categories: {
    some: {
      translations: {
        some: {
          locale: 'en',
          slug: 'combo',
        },
      },
    },
  },
} as const;

export function buildComboProductWhereBase(
  locale: StorefrontLocale,
  query: ComboMenuQuery
): Prisma.ProductWhereInput {
  const variantPriceSome = buildPublishedVariantPriceSomeWhere(
    resolveVariantUsdBoundsFromAmd(query.minPriceAmd, query.maxPriceAmd)
  );

  return {
    published: true,
    deletedAt: null,
    ...COMBO_ONLY_CATEGORY_FILTER,
    ...(query.selectedSearchQuery
      ? {
          translations: {
            some: {
              locale: { in: [locale, 'en'] },
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

export function buildComboProductWhere(
  locale: StorefrontLocale,
  query: ComboMenuQuery,
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

/** Lean listing select (same shape as shop menu; no variant options join). */
export function getComboProductSelect(locale: StorefrontLocale): Prisma.ProductSelect {
  return getShopProductSelect(locale);
}

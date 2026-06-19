import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { Prisma } from '@prisma/client';
import { buildMenuProductWhereBase } from '../menu-page/menu-page-product-where-base';
import type { ComboMenuQuery } from './combo-page-query.types';
import { getShopProductSelect } from '../shop-page/shop-page-product-where';

export function buildComboProductWhereBase(
  locale: StorefrontLocale,
  query: ComboMenuQuery
): Prisma.ProductWhereInput {
  return buildMenuProductWhereBase(locale, query, 'only');
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

/** Lean listing select (same shape as shop menu fast path). */
export function getComboProductSelect(locale: StorefrontLocale): Prisma.ProductSelect {
  return getShopProductSelect(locale, { menuFast: true });
}

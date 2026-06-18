import type { StorefrontLocale } from '@/lib/i18n/locale';
import { buildProductWhereTasteCapability } from '@/lib/product-food-attributes';
import {
  buildPublishedVariantPriceSomeWhere,
  resolveVariantUsdBoundsFromAmd,
} from '@/lib/storefront/variant-price-filter';
import type { Prisma } from '@prisma/client';
import type { MenuPageComboScope, MenuPageFilterQuery } from './menu-page-query.types';

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

function resolveComboCategoryFilter(comboScope: MenuPageComboScope): Prisma.ProductWhereInput {
  return comboScope === 'only' ? COMBO_ONLY_CATEGORY_FILTER : COMBO_EXCLUSION_CATEGORY_FILTER;
}

/** Shared Prisma where base for shop and combo menu product listings. */
export function buildMenuProductWhereBase(
  locale: StorefrontLocale,
  query: MenuPageFilterQuery,
  comboScope: MenuPageComboScope
): Prisma.ProductWhereInput {
  const variantPriceSome = buildPublishedVariantPriceSomeWhere(
    resolveVariantUsdBoundsFromAmd(query.minPriceAmd, query.maxPriceAmd)
  );

  return {
    published: true,
    deletedAt: null,
    ...resolveComboCategoryFilter(comboScope),
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

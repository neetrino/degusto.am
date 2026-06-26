import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { Prisma } from '@prisma/client';

function cardLocaleFilter(locale: StorefrontLocale): { in: StorefrontLocale[] } {
  return { in: [locale, 'en'] };
}

/**
 * Lean Prisma select for legacy list API card mode (`?ids=&view=card`).
 * Matches shop/related card queries — no variant options or productAttributes.
 */
export function getStorefrontProductCardSelect(locale: StorefrontLocale) {
  const localeFilter = cardLocaleFilter(locale);

  return {
    id: true,
    discountPercent: true,
    primaryCategoryId: true,
    media: true,
    translations: {
      where: {
        locale: localeFilter,
      },
      select: {
        slug: true,
        title: true,
        locale: true,
      },
    },
    variants: {
      where: {
        published: true,
      },
      orderBy: {
        price: 'asc',
      },
      take: 1,
      select: {
        id: true,
        published: true,
        price: true,
        compareAtPrice: true,
        stock: true,
      },
    },
    categories: {
      where: {
        deletedAt: null,
        published: true,
      },
      select: {
        id: true,
        translations: {
          where: {
            locale: localeFilter,
          },
          select: {
            slug: true,
            title: true,
            locale: true,
          },
        },
      },
    },
  } satisfies Prisma.ProductSelect;
}

export type StorefrontProductCardSelect = ReturnType<typeof getStorefrontProductCardSelect>;

export type StorefrontProductCardRow = Prisma.ProductGetPayload<{
  select: StorefrontProductCardSelect;
}>;

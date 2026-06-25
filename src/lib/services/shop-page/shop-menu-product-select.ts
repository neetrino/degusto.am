import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { Prisma } from '@prisma/client';

/** Shared locale filter for shop/combo menu card queries. */
function shopMenuLocaleFilter(locale: StorefrontLocale): { in: StorefrontLocale[] } {
  return { in: [locale, 'en'] };
}

/**
 * Lean Prisma select for shop/combo menu cards.
 * Omits review rows and variant.attributes (loaded in batch only when needed).
 */
export function getShopMenuProductSelect(locale: StorefrontLocale): Prisma.ProductSelect {
  const localeFilter = shopMenuLocaleFilter(locale);

  return {
    id: true,
    discountPercent: true,
    supportsSpicy: true,
    supportsGreens: true,
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
      select: {
        id: true,
        published: true,
        price: true,
        compareAtPrice: true,
        stock: true,
      },
    },
    _count: {
      select: {
        variants: {
          where: {
            published: true,
          },
        },
        reviews: {
          where: {
            published: true,
          },
        },
      },
    },
  };
}

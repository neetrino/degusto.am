import { BodyBackground } from '../../components/BodyBackground';
import { FigmaDesktopComboPage } from '../../components/home/FigmaDesktopComboPage';
import { FigmaMobileShopPage } from '../../components/home/FigmaMobileShopPage';
import type { MenuCard, MenuCategory } from '../../components/home/FigmaDesktopShopPage';
import { db } from '@white-shop/db';
import { cookies } from 'next/headers';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';

const HY_CATEGORY_TITLE_BY_SLUG: Record<string, string> = {
  electronics: 'Էլեկտրոնիկա',
  clothing: 'Հագուստ',
  shoes: 'Կոշիկներ',
  'home-garden': 'Տուն և այգի',
  sports: 'Սպորտ',
  books: 'Գրքեր',
  accessories: 'Աքսեսուարներ',
};

function toImageUrl(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }
  const first = media[0];
  if (typeof first === 'string' && first.trim()) {
    return first;
  }
  if (first && typeof first === 'object' && !Array.isArray(first)) {
    const value = first as { url?: unknown; src?: unknown; value?: unknown };
    if (typeof value.url === 'string' && value.url.trim()) return value.url;
    if (typeof value.src === 'string' && value.src.trim()) return value.src;
    if (typeof value.value === 'string' && value.value.trim()) return value.value;
  }
  return null;
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

function resolveCategoryTitle(
  currentLocale: string,
  translation: { locale: string; title: string; slug: string }
): string {
  if (!currentLocale.toLowerCase().startsWith('hy')) {
    return translation.title;
  }
  if (translation.locale.toLowerCase().startsWith('hy')) {
    return translation.title;
  }
  return HY_CATEGORY_TITLE_BY_SLUG[translation.slug] || translation.title;
}

export default async function ComboPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const cookieStore = await cookies();
  const locale = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const selectedCategorySlug =
    typeof params?.category === 'string' ? params.category.trim() : '';
  const allCategoriesLabel = locale === 'hy' ? 'Բոլորը' : 'All';
  const productWhere = {
    published: true,
    deletedAt: null,
    ...(selectedCategorySlug
      ? {
          categories: {
            some: {
              deletedAt: null,
              published: true,
              translations: {
                some: {
                  locale: { in: [locale, 'en'] },
                  slug: selectedCategorySlug,
                },
              },
            },
          },
        }
      : {}),
  };

  const productRows = await db.product.findMany({
    where: productWhere,
    orderBy: {
      updatedAt: 'desc',
    },
    take: 12,
    select: {
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
              locale: {
                in: [locale, 'en'],
              },
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
          locale: {
            in: [locale, 'en'],
          },
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
        take: 1,
        select: {
          price: true,
          compareAtPrice: true,
        },
      },
    },
  });

  const categoryRows = await db.category.findMany({
    where: {
      published: true,
      deletedAt: null,
    },
    orderBy: {
      position: 'asc',
    },
    select: {
      id: true,
      media: true,
      translations: {
        where: {
          locale: {
            in: [locale, 'en'],
          },
        },
        select: {
          locale: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  const categories: MenuCategory[] = [
    {
      id: 'all',
      slug: '',
      title: allCategoriesLabel,
      iconUrl: null,
    },
  ];

  for (const row of categoryRows) {
    const translation =
      row.translations.find((item) => item.locale === locale) ?? row.translations[0];
    if (!translation?.slug || !translation.title) {
      continue;
    }

    categories.push({
      id: row.id,
      slug: translation.slug,
      title: resolveCategoryTitle(locale, translation),
      iconUrl: toImageUrl(row.media),
    });
  }

  const cards: MenuCard[] = productRows.map((row, index) => {
    const translation =
      row.translations.find((item) => item.locale === locale) ?? row.translations[0];
    const categoryTranslation =
      row.categories[0]?.translations.find((item) => item.locale === locale) ??
      row.categories[0]?.translations[0];
    const variant = row.variants[0];
    const price = variant?.price ?? 0;
    const oldPrice = variant?.compareAtPrice ?? price;
    return {
      id: row.id,
      slug: translation?.slug || 'products',
      titleKey: 'home.figma.mobile.product.title',
      subtitleKey: 'home.figma.mobile.product.subtitle',
      title: translation?.title || `Product ${index + 1}`,
      category: categoryTranslation ? resolveCategoryTitle(locale, categoryTranslation) : '',
      image: toImageUrl(row.media),
      price,
      oldPrice,
      discount: '',
      discountPercent: row.discountPercent,
    };
  });

  return (
    <div className="min-h-screen bg-white">
      <BodyBackground color="#ffffff" />
      <div className="lg:hidden">
        <FigmaMobileShopPage />
      </div>
      <FigmaDesktopComboPage
        cards={cards}
        categories={categories}
        activeCategorySlug={selectedCategorySlug}
      />
    </div>
  );
}

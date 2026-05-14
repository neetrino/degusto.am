import { FigmaDesktopMenuPage, type MenuCard, type MenuCategory } from '../../components/home/FigmaDesktopShopPage';
import { BodyBackground } from '../../components/BodyBackground';
import { HIDDEN_STOREFRONT_CATEGORY_SLUGS } from '@/constants/hidden-storefront-category-slugs';
import { STORE_MENU_PAGE_SIZE } from '@/constants/store-menu-page-size';
import { db } from '@white-shop/db';
import { cookies } from 'next/headers';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import type { Prisma } from '@prisma/client';
import { buildProductWhereTasteCapability, resolveFoodAttributeFlagsFromVariants } from '@/lib/product-food-attributes';
import { storefrontAmdPriceBoundToVariantUsd } from '@/lib/currency';

/** Always read fresh data from DB on each request (no static cache for this route). */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const HY_CATEGORY_TITLE_BY_SLUG: Record<string, string> = {
  shawarma: 'Շաուրմա',
  burger: 'Բուրգեր',
  kebab: 'Քեբաբ',
  wraps: 'Ռոլլեր',
  plates: 'Ափսեներ',
  snacks: 'Խորտիկներ',
  sandwiches: 'Սենդվիչներ',
  pasta: 'Պաստա',
  combo: 'Կոմբո',
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

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
}) {
  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const cookieStore = await cookies();
  const locale = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const selectedCategorySlug =
    typeof params?.category === 'string' ? params.category.trim() : '';
  const selectedSearchQuery =
    typeof params?.search === 'string' ? params.search.trim() : '';
  const tasteFilter =
    params?.taste === 'leaf' || params?.taste === 'pepper' ? params.taste : null;
  const minPriceParam =
    typeof params?.minPrice === 'string' ? Number(params.minPrice) : null;
  const maxPriceParam =
    typeof params?.maxPrice === 'string' ? Number(params.maxPrice) : null;
  /** User-facing filter amounts in AMD (URL query). */
  const minPriceAmd =
    typeof minPriceParam === 'number' && Number.isFinite(minPriceParam) && minPriceParam >= 0
      ? minPriceParam
      : null;
  const maxPriceAmd =
    typeof maxPriceParam === 'number' && Number.isFinite(maxPriceParam) && maxPriceParam >= 0
      ? maxPriceParam
      : null;
  const minPriceUsd =
    minPriceAmd !== null ? storefrontAmdPriceBoundToVariantUsd(minPriceAmd) : null;
  const maxPriceUsd =
    maxPriceAmd !== null ? storefrontAmdPriceBoundToVariantUsd(maxPriceAmd) : null;
  const rawPage = typeof params?.page === 'string' ? params.page.trim() : '';
  const parsedPage = parseInt(rawPage || '1', 10);
  const requestedPage =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const allCategoriesLabel = locale === 'hy' ? 'Բոլորը' : 'All';
  const comboExclusionCategoryFilter = {
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
  const productWhere: Prisma.ProductWhereInput = {
    published: true,
    deletedAt: null,
    ...comboExclusionCategoryFilter,
    ...(selectedSearchQuery
      ? {
          translations: {
            some: {
              locale: { in: [locale, 'en'] },
              OR: [
                {
                  title: {
                    contains: selectedSearchQuery,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  subtitle: {
                    contains: selectedSearchQuery,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            },
          },
        }
      : {}),
    ...((minPriceUsd !== null || maxPriceUsd !== null)
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
    ...(tasteFilter ? buildProductWhereTasteCapability(tasteFilter) : {}),
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
  const productTotal = await db.product.count({ where: productWhere });
  const totalPages =
    productTotal === 0 ? 0 : Math.ceil(productTotal / STORE_MENU_PAGE_SIZE);
  const effectivePage =
    totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
  const productRows = await db.product.findMany({
    where: productWhere,
    orderBy: {
      updatedAt: 'desc',
    },
    skip: (effectivePage - 1) * STORE_MENU_PAGE_SIZE,
    take: STORE_MENU_PAGE_SIZE,
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
        select: {
          published: true,
          price: true,
          compareAtPrice: true,
          attributes: true,
          options: {
            select: {
              attributeKey: true,
              value: true,
              valueId: true,
              attributeValue: {
                select: {
                  value: true,
                  attribute: {
                    select: {
                      key: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const categoryRows = await db.category.findMany({
    where: {
      published: true,
      deletedAt: null,
      translations: {
        none: {
          locale: 'en',
          slug: 'combo',
        },
      },
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
    if (HIDDEN_STOREFRONT_CATEGORY_SLUGS.has(translation.slug.toLowerCase())) {
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
    const foodAttrs = resolveFoodAttributeFlagsFromVariants(row.variants);
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
      supportsSpicy: foodAttrs.supportsSpicy,
      supportsGreens: foodAttrs.supportsGreens,
    };
  });

  return (
    <div className="min-h-screen bg-white">
      <BodyBackground color="#ffffff" />
      <FigmaDesktopMenuPage
        titleKey="home.figma.desktop.shop.menuTitle"
        subtitleKey="home.figma.desktop.shop.menuSubtitle"
        activeCategoryIndex={0}
        cards={cards}
        categories={categories}
        activeCategorySlug={selectedCategorySlug}
        initialSearch={selectedSearchQuery}
        initialMinPrice={minPriceAmd !== null ? String(minPriceAmd) : ''}
        initialMaxPrice={maxPriceAmd !== null ? String(maxPriceAmd) : ''}
        initialFoodFilter={tasteFilter ?? 'neutral'}
        menuPagination={{
          currentPage: effectivePage,
          totalPages,
        }}
      />
    </div>
  );
}

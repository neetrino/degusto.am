import { HIDDEN_STOREFRONT_CATEGORY_SLUGS } from '@/constants/hidden-storefront-category-slugs';
import type { MenuCard } from '@/components/home/menu-types';
import { resolveFoodAttributeFlagsFromVariants } from '@/lib/product-food-attributes';
import { resolveMenuCardCompareAtPrice } from '@/lib/storefront/menu-card-pricing';
import { resolveStorefrontProductImageFromMedia } from '@/constants/storefront-product-image';
import { processImageUrl, type ImageUrlInput } from '@/lib/utils/image-utils';

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

export type ShopCategoryEntry = {
  id: string;
  slug: string;
  title: string;
  iconUrl: string | null;
};

type CategoryTranslationRow = {
  locale: string;
  title: string;
  slug: string;
};

type CategoryDbRow = {
  id: string;
  media: unknown;
  translations: CategoryTranslationRow[];
};

export type ShopMenuProductRow = {
  id: string;
  discountPercent: number | null;
  media: unknown;
  categories: Array<{
    translations: CategoryTranslationRow[];
  }>;
  translations: Array<{
    locale: string;
    title: string;
    subtitle: string | null;
    slug: string;
  }>;
  variants: Array<{
    id: string;
    published: boolean;
    price: number;
    compareAtPrice: number | null;
    attributes: unknown;
  }>;
};

export function toShopMenuImageUrl(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }
  return processImageUrl(media[0] as ImageUrlInput);
}

export function resolveShopCategoryTitle(
  currentLocale: string,
  translation: CategoryTranslationRow
): string {
  if (!currentLocale.toLowerCase().startsWith('hy')) {
    return translation.title;
  }
  if (translation.locale.toLowerCase().startsWith('hy')) {
    return translation.title;
  }
  return HY_CATEGORY_TITLE_BY_SLUG[translation.slug] || translation.title;
}

export function buildShopCategoryEntries(
  locale: string,
  allCategoriesLabel: string,
  categoryRows: CategoryDbRow[]
): ShopCategoryEntry[] {
  const entries: ShopCategoryEntry[] = [
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

    entries.push({
      id: row.id,
      slug: translation.slug,
      title: resolveShopCategoryTitle(locale, translation),
      iconUrl: toShopMenuImageUrl(row.media),
    });
  }

  return entries;
}

export function mapShopProductRowsToMenuCards(
  locale: string,
  productRows: ShopMenuProductRow[]
): MenuCard[] {
  return productRows.map((row, index) => {
    const translation =
      row.translations.find((item) => item.locale === locale) ?? row.translations[0];
    const categoryTranslation =
      row.categories[0]?.translations.find((item) => item.locale === locale) ??
      row.categories[0]?.translations[0];
    const variant = row.variants[0];
    const price = variant?.price ?? 0;
    const oldPrice = resolveMenuCardCompareAtPrice(price, variant?.compareAtPrice);
    const foodAttrs = resolveFoodAttributeFlagsFromVariants(row.variants);

    return {
      id: row.id,
      slug: translation?.slug || 'products',
      titleKey: 'home.figma.mobile.product.title',
      subtitleKey: 'home.figma.mobile.product.subtitle',
      title: translation?.title || `Product ${index + 1}`,
      category: categoryTranslation ? resolveShopCategoryTitle(locale, categoryTranslation) : '',
      image: resolveStorefrontProductImageFromMedia(row.media),
      price,
      oldPrice,
      discount: '',
      discountPercent: row.discountPercent,
      inStock: variant?.published ?? true,
      defaultVariantId: variant?.id ?? null,
      supportsSpicy: foodAttrs.supportsSpicy,
      supportsGreens: foodAttrs.supportsGreens,
    };
  });
}

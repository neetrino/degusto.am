import { HIDDEN_STOREFRONT_CATEGORY_SLUGS } from '@/constants/hidden-storefront-category-slugs';
import type { MenuCard } from '@/components/home/menu-types';
import {
  mapShopMenuProductRowsToProductCardDtos,
  mapProductCardDtosToMenuCards,
} from '@/lib/storefront/product-card-dto';
import { processImageUrl, type ImageUrlInput } from '@/lib/utils/image-utils';
import { resolveShopCategoryTitle } from './shop-page-category-titles';
import type { ShopMenuProductRow } from './shop-page-product-row.types';

export type { ShopMenuProductRow } from './shop-page-product-row.types';

const SHOP_ALL_CATEGORY_ICON_URL = '/categories/figma/all.svg';

export type ShopCategoryEntry = {
  id: string;
  slug: string;
  title: string;
  iconUrl: string | null;
};

type CategoryDbRow = {
  id: string;
  media: unknown;
  translations: CategoryTranslationRow[];
};

type CategoryTranslationRow = {
  locale: string;
  title: string;
  slug: string;
};

export function toShopMenuImageUrl(media: unknown): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }
  return processImageUrl(media[0] as ImageUrlInput);
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
      iconUrl: SHOP_ALL_CATEGORY_ICON_URL,
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
  return mapProductCardDtosToMenuCards(mapShopMenuProductRowsToProductCardDtos(locale, productRows));
}

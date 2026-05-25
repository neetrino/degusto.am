import { resolveStorefrontProductImageFromMedia } from '@/constants/storefront-product-image';
import type { HomeFeaturedProduct } from '@/components/home/home-page-types';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { resolveFoodAttributeFlagsFromVariants } from '@/lib/product-food-attributes';
import { db } from '@white-shop/db';
import { revalidateStorefrontMenuCaches } from '@/lib/cache/revalidate-storefront-menu-caches';
import {
  DAILY_OFFER_SETTINGS_KEY,
  EMPTY_DAILY_OFFER_SELECTION,
  type DailyOfferPlatform,
  type DailyOfferSelection,
} from './daily-offer.types';

type DailyOfferProductRow = {
  id: string;
  discountPercent: number;
  media: unknown;
  translations: Array<{ locale: string; slug: string; title: string }>;
  categories: Array<{ translations: Array<{ locale: string; title: string }> }>;
  variants: Array<{
    id: string;
    published: boolean;
    price: number;
    compareAtPrice: number | null;
    attributes: unknown;
  }>;
};

function toPositiveNumber(value: number | null | undefined): number | null {
  if (typeof value !== 'number') {
    return null;
  }
  return Number.isFinite(value) && value > 0 ? value : null;
}

function getHomeProductSelect(homeLang: StorefrontLocale) {
  return {
    id: true,
    discountPercent: true,
    media: true,
    translations: {
      where: {
        locale: {
          in: [homeLang, 'en'],
        },
      },
      select: {
        locale: true,
        slug: true,
        title: true,
      },
    },
    categories: {
      take: 1,
      select: {
        translations: {
          where: {
            locale: {
              in: [homeLang, 'en'],
            },
          },
          select: {
            locale: true,
            title: true,
          },
        },
      },
    },
    variants: {
      where: {
        published: true,
      },
      orderBy: {
        price: 'asc' as const,
      },
      select: {
        id: true,
        published: true,
        price: true,
        compareAtPrice: true,
        attributes: true,
      },
    },
  };
}

function mapProductRowToHomeFeatured(
  product: DailyOfferProductRow,
  homeLang: StorefrontLocale
): HomeFeaturedProduct {
  const preferredTranslation =
    product.translations.find((translation) => translation.locale === homeLang) ??
    product.translations[0];
  const firstCategory = product.categories[0];
  const preferredCategoryTranslation =
    firstCategory?.translations.find((translation) => translation.locale === homeLang) ??
    firstCategory?.translations[0];
  const mainVariant = product.variants[0];
  const foodAttrs = resolveFoodAttributeFlagsFromVariants(product.variants);

  return {
    id: product.id,
    slug: preferredTranslation?.slug || 'products',
    title: preferredTranslation?.title || 'Product',
    subtitle: preferredCategoryTranslation?.title || 'Կատեգորիա',
    price: toPositiveNumber(mainVariant?.price),
    oldPrice: toPositiveNumber(mainVariant?.compareAtPrice),
    image: resolveStorefrontProductImageFromMedia(product.media),
    discountPercent: toPositiveNumber(product.discountPercent),
    inStock: mainVariant?.published ?? true,
    defaultVariantId: mainVariant?.id ?? null,
    supportsSpicy: foodAttrs.supportsSpicy,
    supportsGreens: foodAttrs.supportsGreens,
  };
}

function parseDailyOfferSelection(value: unknown): DailyOfferSelection {
  if (!value || typeof value !== 'object') {
    return { ...EMPTY_DAILY_OFFER_SELECTION };
  }

  const record = value as Record<string, unknown>;
  const mobileProductId =
    typeof record.mobileProductId === 'string' ? record.mobileProductId : null;
  const desktopProductId =
    typeof record.desktopProductId === 'string' ? record.desktopProductId : null;

  return { mobileProductId, desktopProductId };
}

export async function getDailyOfferSelection(): Promise<DailyOfferSelection> {
  const setting = await db.settings.findUnique({
    where: { key: DAILY_OFFER_SETTINGS_KEY },
    select: { value: true },
  });

  if (!setting) {
    return { ...EMPTY_DAILY_OFFER_SELECTION };
  }

  return parseDailyOfferSelection(setting.value);
}

async function persistDailyOfferSelection(selection: DailyOfferSelection): Promise<DailyOfferSelection> {
  await db.settings.upsert({
    where: { key: DAILY_OFFER_SETTINGS_KEY },
    update: {
      value: selection,
      updatedAt: new Date(),
    },
    create: {
      key: DAILY_OFFER_SETTINGS_KEY,
      value: selection,
      description: 'Active daily-offer product IDs for mobile and desktop home pages',
    },
  });

  revalidateStorefrontMenuCaches();
  return selection;
}

async function assertProductExists(productId: string): Promise<void> {
  const product = await db.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { id: true },
  });

  if (!product) {
    throw new Error('Product not found');
  }
}

/** Toggle daily offer for mobile and desktop until admin picks another product. */
export async function toggleDailyOfferProduct(productId: string): Promise<DailyOfferSelection> {
  const current = await getDailyOfferSelection();
  const isActive =
    current.mobileProductId === productId && current.desktopProductId === productId;

  if (isActive) {
    return persistDailyOfferSelection({
      mobileProductId: null,
      desktopProductId: null,
    });
  }

  await assertProductExists(productId);

  return persistDailyOfferSelection({
    mobileProductId: productId,
    desktopProductId: productId,
  });
}

async function loadHomeFeaturedProductById(
  productId: string,
  homeLang: StorefrontLocale
): Promise<HomeFeaturedProduct | null> {
  const product = await db.product.findFirst({
    where: {
      id: productId,
      published: true,
      deletedAt: null,
    },
    select: getHomeProductSelect(homeLang),
  });

  if (!product) {
    return null;
  }

  return mapProductRowToHomeFeatured(product, homeLang);
}

export async function loadActiveDailyOffersForHome(
  homeLang: StorefrontLocale
): Promise<{ mobile: HomeFeaturedProduct | null; desktop: HomeFeaturedProduct | null }> {
  const selection = await getDailyOfferSelection();

  const [mobile, desktop] = await Promise.all([
    selection.mobileProductId
      ? loadHomeFeaturedProductById(selection.mobileProductId, homeLang)
      : Promise.resolve(null),
    selection.desktopProductId
      ? loadHomeFeaturedProductById(selection.desktopProductId, homeLang)
      : Promise.resolve(null),
  ]);

  return { mobile, desktop };
}

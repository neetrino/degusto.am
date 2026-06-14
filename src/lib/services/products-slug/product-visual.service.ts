import { db } from "@white-shop/db";
import {
  getStorefrontLocaleFallbackChain,
  type StorefrontLocale,
} from "@/lib/i18n/locale";
import { getStorefrontDiscountSettings } from "@/lib/services/storefront/get-storefront-discount-settings";
import { logger } from "../../utils/logger";
import { computeProductGalleryUrls } from "./product-gallery-urls";
import { getBaseWhere } from "./product-query-builder";
import type { ProductLabel } from "@/components/ProductLabels";

export interface ProductVisualPayload {
  id: string;
  slug: string;
  title: string;
  category: {
    slug: string;
    title: string;
  } | null;
  brand: string | null;
  price: number;
  oldPrice: number | null;
  discountPercent: number | null;
  currency: "USD";
  inStock: boolean;
  defaultVariantId: string | null;
  labels: Array<{
    id: string;
    type: "text" | "percentage";
    value: string;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    color: string | null;
  }>;
  seo: {
    title: string;
    description: string | null;
  };
  mainImage: string | null;
  galleryImages: string[];
  aspectRatio: string;
  imageWidth: number | null;
  imageHeight: number | null;
}

function resolveDiscountPercent(
  productDiscount: number,
  primaryCategoryId: string | null,
  categoryDiscounts: Record<string, number>,
  globalDiscount: number
): number {
  if (productDiscount > 0) {
    return productDiscount;
  }
  if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
    return categoryDiscounts[primaryCategoryId];
  }
  if (globalDiscount > 0) {
    return globalDiscount;
  }
  return 0;
}

function pickTranslation<T extends { locale: string }>(
  translations: T[],
  lang: string
): T | null {
  const fallbacks = getStorefrontLocaleFallbackChain(lang as StorefrontLocale);
  for (const locale of fallbacks) {
    const match = translations.find((row) => row.locale === locale);
    if (match) {
      return match;
    }
  }
  return translations[0] ?? null;
}

async function fetchVisualRow(slug: string, lang: string) {
  const fallbacks = getStorefrontLocaleFallbackChain(lang as StorefrontLocale);
  return db.product.findFirst({
    where: getBaseWhere(slug, lang),
    select: {
      id: true,
      media: true,
      translations: {
        where: { locale: { in: fallbacks } },
        select: {
          locale: true,
          slug: true,
          title: true,
          seoTitle: true,
          seoDescription: true,
        },
        take: fallbacks.length,
      },
      primaryCategoryId: true,
      discountPercent: true,
      labels: {
        select: {
          id: true,
          type: true,
          value: true,
          position: true,
          color: true,
        },
      },
      categories: {
        select: {
          translations: {
            where: { locale: { in: fallbacks } },
            select: {
              locale: true,
              slug: true,
              title: true,
            },
            take: fallbacks.length,
          },
        },
      },
      variants: {
        where: { published: true },
        orderBy: [{ price: "asc" }, { position: "asc" }],
        select: {
          id: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          imageUrl: true,
          position: true,
        },
      },
    },
  });
}

async function mapRowToPayload(
  row: NonNullable<Awaited<ReturnType<typeof fetchVisualRow>>>,
  lang: string
): Promise<ProductVisualPayload | null> {
  const tr = pickTranslation(row.translations, lang);
  if (!tr) {
    return null;
  }
  const { globalDiscount, categoryDiscounts } =
    await getStorefrontDiscountSettings();
  const variant = row.variants[0] ?? null;
  const priceBeforeDiscount = variant?.price ?? 0;
  const discountPercent = resolveDiscountPercent(
    row.discountPercent ?? 0,
    row.primaryCategoryId ?? null,
    categoryDiscounts,
    globalDiscount
  );
  const discountMultiplier = discountPercent > 0 ? 1 - discountPercent / 100 : 1;
  const price =
    priceBeforeDiscount > 0
      ? Number((priceBeforeDiscount * discountMultiplier).toFixed(2))
      : 0;
  const oldPrice =
    discountPercent > 0
      ? priceBeforeDiscount
      : (variant?.compareAtPrice ?? null);

  const categoryTranslation = row.categories
    .map((category) => pickTranslation(category.translations, lang))
    .find((entry) => Boolean(entry));
  const galleryImages = computeProductGalleryUrls(row.media as unknown[], row.variants);
  const mainImage = galleryImages[0] ?? null;
  return {
    id: row.id,
    slug: tr.slug,
    title: tr.title,
    category: categoryTranslation
      ? {
          slug: categoryTranslation.slug,
          title: categoryTranslation.title,
        }
      : null,
    brand: null,
    price,
    oldPrice,
    discountPercent: discountPercent > 0 ? discountPercent : null,
    currency: "USD",
    inStock: (variant?.stock ?? 0) > 0,
    defaultVariantId: variant?.id ?? null,
    labels: row.labels.map((label) => ({
      id: label.id,
      type: label.type as ProductLabel["type"],
      value: label.value,
      position: label.position as ProductLabel["position"],
      color: label.color ?? null,
    })),
    seo: {
      title: tr.seoTitle ?? tr.title,
      description: tr.seoDescription ?? null,
    },
    mainImage,
    galleryImages,
    aspectRatio: "1 / 1",
    imageWidth: null,
    imageHeight: null,
  };
}

/**
 * Minimal published-product payload for first paint (images + SEO-safe title).
 */
export async function findVisualBySlug(
  slug: string,
  lang: string
): Promise<ProductVisualPayload | null> {
  try {
    const row = await fetchVisualRow(slug, lang);
    if (!row) {
      return null;
    }
    return await mapRowToPayload(row, lang);
  } catch (error: unknown) {
    logger.warn("findVisualBySlug failed", {
      slug,
      lang,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

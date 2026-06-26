import { db } from "@white-shop/db";
import {
  getStorefrontLocaleFallbackChain,
  type StorefrontLocale,
} from "@/lib/i18n/locale";
import { hasSellableStock } from "@/lib/product-stock";
import { getStorefrontDiscountSettings } from "@/lib/services/storefront/get-storefront-discount-settings";
import { logger } from "../../utils/logger";
import { getBaseWhere } from "./product-query-builder";

export type ProductQuickAddVariant = {
  id: string;
  price: number;
  stock: number;
  available: boolean;
};

export type ProductQuickAddPayload = {
  id: string;
  slug: string;
  defaultVariantId: string | null;
  variants: ProductQuickAddVariant[];
};

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

function pickAppliedDiscount(
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

async function fetchQuickAddRow(slug: string, lang: string) {
  const fallbacks = getStorefrontLocaleFallbackChain(lang as StorefrontLocale);
  return db.product.findFirst({
    where: getBaseWhere(slug, lang),
    select: {
      id: true,
      discountPercent: true,
      primaryCategoryId: true,
      translations: {
        where: { locale: { in: fallbacks } },
        select: { slug: true, locale: true },
        take: fallbacks.length,
      },
      variants: {
        where: { published: true },
        orderBy: [{ price: "asc" }, { position: "asc" }],
        select: {
          id: true,
          price: true,
          stock: true,
          published: true,
        },
      },
    },
  });
}

function mapVariants(
  variants: Array<{
    id: string;
    price: number;
    stock: number;
    published: boolean;
  }>,
  appliedDiscount: number
): ProductQuickAddVariant[] {
  return variants.map((variant) => {
    const originalPrice = variant.price;
    let finalPrice = originalPrice;
    if (appliedDiscount > 0 && originalPrice > 0) {
      finalPrice = Number((originalPrice * (1 - appliedDiscount / 100)).toFixed(2));
    }

    return {
      id: variant.id,
      price: finalPrice,
      stock: variant.stock,
      available: variant.published === true && hasSellableStock(variant.stock),
    };
  });
}

/**
 * Minimal published-product payload for quick add-to-cart (variant id + price + stock).
 */
export async function findQuickAddBySlug(
  slug: string,
  lang: string
): Promise<ProductQuickAddPayload | null> {
  try {
    const row = await fetchQuickAddRow(slug, lang);
    if (!row) {
      return null;
    }

    const tr = pickTranslation(row.translations, lang);
    if (!tr) {
      return null;
    }

    const { globalDiscount, categoryDiscounts } =
      await getStorefrontDiscountSettings();
    const appliedDiscount = pickAppliedDiscount(
      row.discountPercent ?? 0,
      row.primaryCategoryId ?? null,
      categoryDiscounts,
      globalDiscount
    );
    const variants = mapVariants(row.variants, appliedDiscount);
    const defaultVariant = variants[0] ?? null;

    return {
      id: row.id,
      slug: tr.slug,
      defaultVariantId: defaultVariant?.id ?? null,
      variants,
    };
  } catch (error: unknown) {
    logger.warn("findQuickAddBySlug failed", {
      slug,
      lang,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

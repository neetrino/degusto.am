import { resolveStorefrontDiscountPercent } from "../../storefront/discount-percent";
import { processImageUrl } from "../../utils/image-utils";
import { getStorefrontDiscountSettings } from "../storefront/get-storefront-discount-settings";

/** Prisma `select` shape for related carousel (minimal joins). */
export interface RelatedProductRow {
  id: string;
  discountPercent: number;
  primaryCategoryId: string | null;
  media: unknown[];
  translations: Array<{ slug: string; title: string; locale: string }>;
  variants: Array<{
    id: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
  }>;
  _count?: {
    reviews?: number;
  };
  categories: Array<{
    id: string;
    translations: Array<{ slug: string; title: string; locale: string }>;
  }>;
}

export interface RelatedCardPayload {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  defaultVariantId: string | null;
  image: string | null;
  inStock: boolean;
  rating: number;
  categories: Array<{ id: string; slug: string; title: string }>;
}

function pickAppliedDiscount(
  productDiscount: number,
  primaryCategoryId: string | null,
  categoryDiscounts: Record<string, number>,
  globalDiscount: number
): number {
  if (productDiscount > 0) return productDiscount;
  if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
    return categoryDiscounts[primaryCategoryId];
  }
  if (globalDiscount > 0) return globalDiscount;
  return 0;
}

function pickTranslation<T extends { locale: string }>(rows: T[], lang: string): T | null {
  return rows.find((t) => t.locale === lang) ?? rows[0] ?? null;
}

function resolveRelatedProductRating(
  product: RelatedProductRow,
  averageRatings: ReadonlyMap<string, number>
): number {
  const reviewCount = product._count?.reviews ?? 0;
  if (reviewCount <= 0) {
    return 5;
  }
  const averageRating = averageRatings.get(product.id);
  if (averageRating == null || !Number.isFinite(averageRating) || averageRating <= 0) {
    return 5;
  }
  return averageRating;
}

/**
 * Map lightweight product rows to public related-card JSON (single settings read).
 */
export async function transformRelatedProductRows(
  rows: RelatedProductRow[],
  lang: string,
  averageRatings: ReadonlyMap<string, number> = new Map()
): Promise<RelatedCardPayload[]> {
  if (rows.length === 0) return [];

  const { globalDiscount, categoryDiscounts } =
    await getStorefrontDiscountSettings();

  return rows.map((product) => {
    const tr = pickTranslation(product.translations, lang);
    const variant = product.variants[0];
    const productDiscount = product.discountPercent || 0;
    const appliedDiscount = pickAppliedDiscount(
      productDiscount,
      product.primaryCategoryId,
      categoryDiscounts,
      globalDiscount
    );

    const originalPrice = variant?.price ?? 0;
    let finalPrice = originalPrice;
    if (appliedDiscount > 0 && originalPrice > 0) {
      finalPrice = originalPrice * (1 - appliedDiscount / 100);
    }

    const categories = product.categories.map((cat) => {
      const ct = pickTranslation(cat.translations, lang);
      return {
        id: cat.id,
        slug: ct?.slug ?? "",
        title: ct?.title ?? "",
      };
    });

    let image: string | null = null;
    if (Array.isArray(product.media) && product.media.length > 0) {
      image = processImageUrl(product.media[0] as string | { url?: string; src?: string; value?: string }) || null;
    }

    const compareAtPrice = variant?.compareAtPrice ?? null;
    const displayOriginalPrice =
      appliedDiscount > 0 ? originalPrice : compareAtPrice;
    const discountPercent = resolveStorefrontDiscountPercent({
      price: finalPrice,
      originalPrice: displayOriginalPrice,
      compareAtPrice,
      productDiscount: appliedDiscount > 0 ? appliedDiscount : null,
    });

    return {
      id: product.id,
      slug: tr?.slug ?? "",
      title: tr?.title ?? "",
      price: finalPrice,
      originalPrice: displayOriginalPrice,
      compareAtPrice,
      discountPercent,
      defaultVariantId: variant?.id ?? null,
      image,
      inStock: (variant?.stock ?? 0) > 0,
      rating: resolveRelatedProductRating(product, averageRatings),
      categories,
    };
  });
}

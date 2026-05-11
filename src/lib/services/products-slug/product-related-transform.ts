import { db } from "@white-shop/db";
import { processImageUrl } from "../../utils/image-utils";

/** Prisma `select` shape for related carousel (minimal joins). */
export interface RelatedProductRow {
  id: string;
  discountPercent: number;
  primaryCategoryId: string | null;
  brandId: string | null;
  media: unknown[];
  translations: Array<{ slug: string; title: string; locale: string }>;
  brand: {
    id: string;
    translations: Array<{ name: string; locale: string }>;
  } | null;
  variants: Array<{
    id: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
  }>;
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
  image: string | null;
  inStock: boolean;
  brand: { id: string; name: string } | null;
  categories: Array<{ id: string; slug: string; title: string }>;
}

async function loadDiscountMaps(): Promise<{
  globalDiscount: number;
  categoryDiscounts: Record<string, number>;
  brandDiscounts: Record<string, number>;
}> {
  const discountSettings = await db.settings.findMany({
    where: {
      key: {
        in: ["globalDiscount", "categoryDiscounts", "brandDiscounts"],
      },
    },
  });

  const globalDiscount =
    Number(discountSettings.find((s) => s.key === "globalDiscount")?.value) || 0;
  const categoryDiscountsSetting = discountSettings.find((s) => s.key === "categoryDiscounts");
  const categoryDiscounts = categoryDiscountsSetting
    ? ((categoryDiscountsSetting.value as Record<string, number>) || {})
    : {};
  const brandDiscountsSetting = discountSettings.find((s) => s.key === "brandDiscounts");
  const brandDiscounts = brandDiscountsSetting
    ? ((brandDiscountsSetting.value as Record<string, number>) || {})
    : {};

  return { globalDiscount, categoryDiscounts, brandDiscounts };
}

function pickAppliedDiscount(
  productDiscount: number,
  primaryCategoryId: string | null,
  brandId: string | null,
  categoryDiscounts: Record<string, number>,
  brandDiscounts: Record<string, number>,
  globalDiscount: number
): number {
  if (productDiscount > 0) return productDiscount;
  if (primaryCategoryId && categoryDiscounts[primaryCategoryId]) {
    return categoryDiscounts[primaryCategoryId];
  }
  if (brandId && brandDiscounts[brandId]) {
    return brandDiscounts[brandId];
  }
  if (globalDiscount > 0) return globalDiscount;
  return 0;
}

function pickTranslation<T extends { locale: string }>(rows: T[], lang: string): T | null {
  return rows.find((t) => t.locale === lang) ?? rows[0] ?? null;
}

/**
 * Map lightweight product rows to public related-card JSON (single settings read).
 */
export async function transformRelatedProductRows(
  rows: RelatedProductRow[],
  lang: string
): Promise<RelatedCardPayload[]> {
  if (rows.length === 0) return [];

  const { globalDiscount, categoryDiscounts, brandDiscounts } = await loadDiscountMaps();

  return rows.map((product) => {
    const tr = pickTranslation(product.translations, lang);
    const brandTr = product.brand
      ? pickTranslation(product.brand.translations, lang)
      : null;
    const variant = product.variants[0];
    const productDiscount = product.discountPercent || 0;
    const appliedDiscount = pickAppliedDiscount(
      productDiscount,
      product.primaryCategoryId,
      product.brandId,
      categoryDiscounts,
      brandDiscounts,
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

    return {
      id: product.id,
      slug: tr?.slug ?? "",
      title: tr?.title ?? "",
      price: finalPrice,
      originalPrice: appliedDiscount > 0 ? originalPrice : variant?.compareAtPrice ?? null,
      compareAtPrice: variant?.compareAtPrice ?? null,
      discountPercent: appliedDiscount > 0 ? appliedDiscount : null,
      image,
      inStock: (variant?.stock ?? 0) > 0,
      brand: product.brand
        ? { id: product.brand.id, name: brandTr?.name ?? "" }
        : null,
      categories,
    };
  });
}

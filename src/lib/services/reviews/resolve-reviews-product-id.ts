import { db } from "@white-shop/db";
import { productsService } from "@/lib/services/products.service";

/**
 * Resolves product id for reviews routes.
 * When `productId` is provided, uses a light query and verifies it matches the URL slug.
 * Otherwise falls back to full `findBySlug` (backward compatible).
 */
export async function resolveReviewsProductId(
  slug: string,
  lang: string,
  productIdParam: string | null
): Promise<string | null> {
  const trimmed = productIdParam?.trim();
  if (trimmed) {
    const row = await db.product.findFirst({
      where: {
        id: trimmed,
        published: true,
        deletedAt: null,
        translations: {
          some: { slug },
        },
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  const product = await productsService.findBySlug(slug, lang);
  return product?.id ?? null;
}

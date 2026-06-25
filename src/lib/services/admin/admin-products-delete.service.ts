import { db } from "@white-shop/db";
import { problemTypes } from "@/lib/http/problem-details";
import { invalidateProductAfterDelete } from "@/lib/services/admin/admin-products-update/cache-revalidator";
import { logger } from "@/lib/utils/logger";

class AdminProductsDeleteService {
  /**
   * Delete product (soft delete)
   */
  async deleteProduct(productId: string) {
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        translations: {
          select: { slug: true },
        },
      },
    });

    if (!product) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist`,
      };
    }

    const translationSlugs = product.translations
      .map((translation) => translation.slug)
      .filter((slug): slug is string => Boolean(slug));

    await db.product.update({
      where: { id: productId },
      data: {
        deletedAt: new Date(),
        published: false,
      },
    });

    await invalidateProductAfterDelete(productId, translationSlugs);

    return { success: true };
  }

  /**
   * Update product discount
   */
  async updateProductDiscount(productId: string, discountPercent: number) {
    logger.debug('💰 [ADMIN PRODUCTS DELETE SERVICE] updateProductDiscount called:', { productId, discountPercent });
    
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      console.error('❌ [ADMIN PRODUCTS DELETE SERVICE] Product not found:', productId);
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist`,
      };
    }

    const clampedDiscount = Math.max(0, Math.min(100, discountPercent));
    logger.debug('💰 [ADMIN PRODUCTS DELETE SERVICE] Updating product discount:', {
      productId,
      oldDiscount: product.discountPercent,
      newDiscount: clampedDiscount,
    });

    const updated = await db.product.update({
      where: { id: productId },
      data: {
        discountPercent: clampedDiscount,
      },
    });

    logger.debug('✅ [ADMIN PRODUCTS DELETE SERVICE] Product discount updated successfully:', {
      productId,
      discountPercent: updated.discountPercent,
    });

    return { success: true, discountPercent: updated.discountPercent };
  }
}

export const adminProductsDeleteService = new AdminProductsDeleteService();







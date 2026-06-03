import {
  buildProductQuery,
  buildProductQueryById,
} from "./products-slug/product-query-builder";
import { problemTypes } from "@/lib/http/problem-details";
import { transformProduct } from "./products-slug/product-transformer";

/**
 * Service for fetching products by slug
 */
class ProductsSlugService {
  /**
   * Get product by slug
   */
  async findBySlug(slug: string, lang: string = "en") {
    const product = await buildProductQuery(slug, lang);

    if (!product) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Product not found",
        detail: `Product with slug '${slug}' does not exist or is not published`,
      };
    }

    return transformProduct(product, lang);
  }

  /**
   * Get product by id (PK lookup — used when slug is already resolved).
   */
  async findById(productId: string, lang: string = "en") {
    const product = await buildProductQueryById(productId, lang);

    if (!product) {
      throw {
        status: 404,
        type: problemTypes.notFound,
        title: "Product not found",
        detail: `Product with id '${productId}' does not exist or is not published`,
      };
    }

    return transformProduct(product, lang);
  }
}

export const productsSlugService = new ProductsSlugService();

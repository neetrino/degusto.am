import { ProductFilters, ProductWithRelations } from "./products-find-query.service";
import { needsInMemoryProductSort } from "./products-find-query/list-query-helpers";

class ProductsFindFilterService {
  /**
   * Apply sorts that cannot run in SQL yet (price min, bestseller rank).
   * Color/size filtering runs in Prisma via buildColorSizeVariantWhere.
   */
  filterProducts(
    products: ProductWithRelations[],
    filters: ProductFilters,
    bestsellerProductIds: string[]
  ): ProductWithRelations[] {
    if (!needsInMemoryProductSort(filters)) {
      return products;
    }

    const { filter, sort = "newest" } = filters;
    if (filter === "bestseller" && bestsellerProductIds.length > 0) {
      const rank = new Map<string, number>();
      bestsellerProductIds.forEach((id, index) => rank.set(id, index));
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aRank = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bRank = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return aRank - bRank;
      });
    } else if (sort === "price-desc" || sort === "price") {
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aVariants = Array.isArray(a.variants) ? a.variants : [];
        const bVariants = Array.isArray(b.variants) ? b.variants : [];
        const aPrice = aVariants.length > 0 ? Math.min(...aVariants.map((v: { price: number }) => v.price)) : 0;
        const bPrice = bVariants.length > 0 ? Math.min(...bVariants.map((v: { price: number }) => v.price)) : 0;
        return bPrice - aPrice;
      });
    } else if (sort === "price-asc") {
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aVariants = Array.isArray(a.variants) ? a.variants : [];
        const bVariants = Array.isArray(b.variants) ? b.variants : [];
        const aPrice = aVariants.length > 0 ? Math.min(...aVariants.map((v: { price: number }) => v.price)) : 0;
        const bPrice = bVariants.length > 0 ? Math.min(...bVariants.map((v: { price: number }) => v.price)) : 0;
        return aPrice - bPrice;
      });
    } else if (sort === "popular" && bestsellerProductIds.length > 0) {
      const rank = new Map<string, number>();
      bestsellerProductIds.forEach((id, index) => rank.set(id, index));
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aRank = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bRank = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return aRank - bRank;
      });
    }

    return products;
  }
}

export const productsFindFilterService = new ProductsFindFilterService();







import { ProductFilters, ProductWithRelations } from "./products-find-query.service";
import {
  needsInMemoryProductSort,
  normalizeFilterList,
} from "./products-find-query/list-query-helpers";

type LegacyVariantOption = ProductWithRelations["variants"][number]["options"][number] & {
  key?: string;
  attribute?: string;
  label?: string;
};

class ProductsFindFilterService {
  /**
   * Filter products by colors/sizes in memory and apply sorts that cannot run in SQL yet.
   */
  filterProducts(
    products: ProductWithRelations[],
    filters: ProductFilters,
    bestsellerProductIds: string[]
  ): ProductWithRelations[] {
    const colorList = normalizeFilterList(filters.colors, (v) => v.toLowerCase());
    const sizeList = normalizeFilterList(filters.sizes, (v) => v.toUpperCase());

    if (colorList.length > 0 || sizeList.length > 0) {
      products = products.filter((product: ProductWithRelations) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        
        if (variants.length === 0) {
          return false;
        }
        
        // Find variants that match ALL specified filters
        const matchingVariants = variants.filter((variant: ProductWithRelations['variants'][number]) => {
          const options = Array.isArray(variant.options) ? variant.options : [];
          
          if (options.length === 0) {
            return false;
          }
          
          const getColorValue = (opt: LegacyVariantOption, lang: string = 'en'): string | null => {
            if ('attributeValue' in opt && opt.attributeValue && opt.attributeValue.attribute?.key === "color") {
              const translation = opt.attributeValue.translations?.find((t: { locale: string }) => t.locale === lang) || opt.attributeValue.translations?.[0];
              return (translation?.label || opt.attributeValue.value || "").trim().toLowerCase();
            }
            if (opt.attributeKey === "color" || opt.key === "color" || opt.attribute === "color") {
              return (opt.value || opt.label || "").trim().toLowerCase();
            }
            return null;
          };
          
          const getSizeValue = (opt: LegacyVariantOption, lang: string = 'en'): string | null => {
            if ('attributeValue' in opt && opt.attributeValue && opt.attributeValue.attribute?.key === "size") {
              const translation = opt.attributeValue.translations?.find((t: { locale: string }) => t.locale === lang) || opt.attributeValue.translations?.[0];
              return (translation?.label || opt.attributeValue.value || "").trim().toUpperCase();
            }
            if (opt.attributeKey === "size" || opt.key === "size" || opt.attribute === "size") {
              return (opt.value || opt.label || "").trim().toUpperCase();
            }
            return null;
          };
          
          if (colorList.length > 0) {
            let colorMatched = false;
            for (const opt of options) {
              const variantColorValue = getColorValue(opt, filters.lang || 'en');
              if (variantColorValue && colorList.includes(variantColorValue)) {
                colorMatched = true;
                break;
              }
            }
            if (!colorMatched) {
              return false;
            }
          }
          
          if (sizeList.length > 0) {
            let sizeMatched = false;
            for (const opt of options) {
              const variantSizeValue = getSizeValue(opt, filters.lang || 'en');
              if (variantSizeValue && sizeList.includes(variantSizeValue)) {
                sizeMatched = true;
                break;
              }
            }
            if (!sizeMatched) {
              return false;
            }
          }
          
          return true;
        });
        
        return matchingVariants.length > 0;
      });
    }

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







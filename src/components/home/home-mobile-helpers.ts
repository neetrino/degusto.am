import type { HomeCategoryItem, HomeFeaturedProduct } from './home-page-types';
import type { MenuCard } from './menu-types';

export const MOBILE_HOME_SECTION_PRODUCT_COUNT = 4;
export const MOBILE_HOME_PRODUCT_GRID_TOTAL = MOBILE_HOME_SECTION_PRODUCT_COUNT * 3;

export type MobileHomeCategory = {
  id: string;
  slug: string;
  title?: string;
  titleKey: string;
  image: string;
  framed?: boolean;
};

export function homeFeaturedProductToMenuCard(product: HomeFeaturedProduct): MenuCard {
  const price = product.price ?? 0;
  const oldPrice = product.oldPrice ?? price;
  const discountPercent =
    typeof product.discountPercent === 'number' && product.discountPercent > 0
      ? Math.round(product.discountPercent)
      : 0;
  const discount = discountPercent > 0 ? `-${discountPercent}%` : '';

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    category: product.subtitle,
    categorySlug: product.categorySlug,
    image: product.image,
    price,
    oldPrice,
    discount,
    discountPercent: product.discountPercent,
    inStock: product.inStock,
    defaultVariantId: product.defaultVariantId,
    supportsSpicy: product.supportsSpicy,
    supportsGreens: product.supportsGreens,
  };
}

export function resolveMobileHomeDiscountPercent(product: HomeFeaturedProduct): number {
  const price = product.price ?? 0;
  const oldPrice = product.oldPrice ?? 0;
  const calculated =
    oldPrice > price && oldPrice > 0
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;
  const fromDb =
    typeof product.discountPercent === 'number' && product.discountPercent > 0
      ? Math.round(product.discountPercent)
      : 0;
  return calculated || fromDb;
}

export function sliceMobileHomeProductSections(featuredProducts: HomeFeaturedProduct[]): {
  newArrivalProducts: HomeFeaturedProduct[];
  categoryProductsA: HomeFeaturedProduct[];
  categoryProductsB: HomeFeaturedProduct[];
} {
  const gridProducts = featuredProducts.slice(0, MOBILE_HOME_PRODUCT_GRID_TOTAL);
  return {
    newArrivalProducts: gridProducts.slice(0, MOBILE_HOME_SECTION_PRODUCT_COUNT),
    categoryProductsA: gridProducts.slice(
      MOBILE_HOME_SECTION_PRODUCT_COUNT,
      MOBILE_HOME_SECTION_PRODUCT_COUNT * 2
    ),
    categoryProductsB: gridProducts.slice(MOBILE_HOME_SECTION_PRODUCT_COUNT * 2),
  };
}

export function buildMobileDisplayCategories(categories: HomeCategoryItem[]): MobileHomeCategory[] {
  return categories.map((category, index) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
    titleKey: 'common.navigation.categories',
    image: category.image,
    framed: index === 0,
  }));
}

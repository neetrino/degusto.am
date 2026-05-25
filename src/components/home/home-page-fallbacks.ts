import { r2Asset } from '@/lib/r2-public-url';
import { HOME_DAILY_OFFER_FALLBACK_PRODUCT } from './home-daily-offer';
import type { HomeCategoryItem, HomeFeaturedProduct } from './home-page-types';

const fallbackCategoryAssets = {
  categorySoup: r2Asset('category/20260512-27SeUi_ujs.png'),
  categorySalad: r2Asset('category/20260512-Np6RG2GuNi.png'),
  categoryShawarma: r2Asset('category/20260512-UOlekxqQyh.png'),
  categoryPizza: r2Asset('category/20260512-j5QKmShMEM.png'),
};

const fallbackFeaturedProducts: HomeFeaturedProduct[] = [HOME_DAILY_OFFER_FALLBACK_PRODUCT];

const fallbackCategories: HomeCategoryItem[] = [
  { id: 'cat-fallback-1', slug: 'soups', title: 'Ապուրներ եւ տաք ուտեստներ', count: 78, image: fallbackCategoryAssets.categorySoup },
  { id: 'cat-fallback-2', slug: 'salads', title: 'Աղցաններ', count: 41, image: fallbackCategoryAssets.categorySalad },
  { id: 'cat-fallback-3', slug: 'shawarma', title: 'Շաուրմա', count: 18, image: fallbackCategoryAssets.categoryShawarma },
  { id: 'cat-fallback-4', slug: 'pizza', title: 'Պիցցա', count: 44, image: fallbackCategoryAssets.categoryPizza },
];

export function resolveHomeFeaturedProducts(products: HomeFeaturedProduct[]): HomeFeaturedProduct[] {
  return products.length > 0 ? products : fallbackFeaturedProducts;
}

export function resolveHomeCategories(categories: HomeCategoryItem[]): HomeCategoryItem[] {
  return categories.length > 0 ? categories : fallbackCategories;
}

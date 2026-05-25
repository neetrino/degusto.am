import { STOREFRONT_PRODUCT_IMAGE_PATH } from '@/constants/storefront-product-image';
import type { HomeFeaturedProduct } from './home-page-types';

export const HOME_DAILY_OFFER_FALLBACK_PRODUCT: HomeFeaturedProduct = {
  id: 'featured-fallback-1',
  slug: 'products',
  title: 'Double Cheeseburger',
  subtitle: 'Բուրգեր',
  price: 1200,
  oldPrice: 1500,
  image: STOREFRONT_PRODUCT_IMAGE_PATH,
  discountPercent: 30,
  supportsSpicy: true,
  supportsGreens: true,
};

/** First featured product for «օրվա առաջարկ» hero / daily-offer card. */
export function resolveHomeDailyOfferProduct(
  featuredProducts: HomeFeaturedProduct[]
): HomeFeaturedProduct {
  return featuredProducts[0] ?? HOME_DAILY_OFFER_FALLBACK_PRODUCT;
}

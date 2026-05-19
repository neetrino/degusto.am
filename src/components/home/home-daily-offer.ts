import { r2Asset } from '@/lib/r2-public-url';
import type { HomeFeaturedProduct } from './FigmaHomePage';

export const HOME_DAILY_OFFER_FALLBACK_PRODUCT: HomeFeaturedProduct = {
  id: 'featured-fallback-1',
  slug: 'products',
  title: 'Double Cheeseburger',
  subtitle: 'Բուրգեր',
  price: 1200,
  oldPrice: 1500,
  image: r2Asset('product/20260512-5XM6tLjCRv.png'),
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

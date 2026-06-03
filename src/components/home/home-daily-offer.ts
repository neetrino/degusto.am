import type { HomeFeaturedProduct } from './home-page-types';

/** First featured product for «օրվա առաջարկ» hero / daily-offer card. */
export function resolveHomeDailyOfferProduct(
  featuredProducts: HomeFeaturedProduct[],
  scheduledProduct?: HomeFeaturedProduct | null
): HomeFeaturedProduct | null {
  if (scheduledProduct) {
    return scheduledProduct;
  }
  return featuredProducts[0] ?? null;
}

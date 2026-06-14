'use client';

import type { HomeFeaturedProduct } from './home-page-types';
import { homeFeaturedProductToMenuCard } from './home-mobile-helpers';
import { MOBILE_SHOP_PRODUCTS_GRID_CLASS } from '@/constants/mobile-figma-storefront';
import { ShopMobileProductCard } from './ShopMobileProductCard';

type MobileHomeProductGridProps = {
  products: HomeFeaturedProduct[];
};

export function MobileHomeProductGrid({ products }: MobileHomeProductGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className={MOBILE_SHOP_PRODUCTS_GRID_CLASS}>
      {products.map((product) => (
        <ShopMobileProductCard
          key={product.id}
          card={homeFeaturedProductToMenuCard(product)}
          enableVisibilityPrefetch={false}
        />
      ))}
    </div>
  );
}

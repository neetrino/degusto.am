'use client';

import type { HomeFeaturedProduct } from './home-page-types';
import { homeFeaturedProductToMenuCard } from './home-mobile-helpers';
import { ShopMobileProductCard } from './ShopMobileProductCard';

type MobileHomeProductGridProps = {
  products: HomeFeaturedProduct[];
};

export function MobileHomeProductGrid({ products }: MobileHomeProductGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]">
      {products.map((product) => (
        <ShopMobileProductCard key={product.id} card={homeFeaturedProductToMenuCard(product)} />
      ))}
    </div>
  );
}

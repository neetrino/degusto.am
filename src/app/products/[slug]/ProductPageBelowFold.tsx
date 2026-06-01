'use client';

import dynamic from 'next/dynamic';
import type { Dispatch, RefCallback, SetStateAction } from 'react';
import type { Review } from '../../../components/ProductReviews/utils';
import type { Product } from './types';
import {
  PDP_RELATED_SECTION_GAP_CLASS,
  STOREFRONT_DESKTOP_CONTENT_CLASS,
} from '@/constants/pdp-figma-tokens';

const PDP_REVIEWS_SHELL_CLASS = `${STOREFRONT_DESKTOP_CONTENT_CLASS} relative z-10 max-lg:px-4 max-lg:py-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-0 lg:py-10`;

const RelatedProducts = dynamic(
  () =>
    import('../../../components/RelatedProducts').then((module) => ({
      default: module.RelatedProducts,
    })),
  { loading: () => null }
);

const ProductReviews = dynamic(
  () =>
    import('../../../components/ProductReviews').then((module) => ({
      default: module.ProductReviews,
    })),
  { loading: () => null }
);

export interface ProductPageBelowFoldProps {
  slug: string;
  product: Product;
  reviewsSectionRef: RefCallback<HTMLDivElement>;
  reviews: Review[];
  reviewsLoading: boolean;
  setReviews: Dispatch<SetStateAction<Review[]>>;
}

/**
 * Below-fold PDP sections loaded in separate chunks (related carousel + reviews).
 */
export function ProductPageBelowFold({
  slug,
  product,
  reviewsSectionRef,
  reviews,
  reviewsLoading,
  setReviews,
}: ProductPageBelowFoldProps) {
  return (
    <>
      <div className={PDP_RELATED_SECTION_GAP_CLASS}>
        <RelatedProducts
          productSlug={slug}
          categorySlug={product.categories?.[0]?.slug}
          currentProductId={product.id}
        />
      </div>

      <div className={PDP_REVIEWS_SHELL_CLASS}>
        <div
          ref={reviewsSectionRef}
          id="product-reviews"
          className="mt-8 scroll-mt-24 max-lg:mt-8 lg:mt-10"
        >
          <ProductReviews
            productSlug={slug}
            productId={product.id}
            reviews={reviews}
            reviewsLoading={reviewsLoading}
            setReviews={setReviews}
          />
        </div>
      </div>
    </>
  );
}

'use client';

import dynamic from 'next/dynamic';
import type { Dispatch, RefCallback, SetStateAction } from 'react';
import { RelatedProducts } from '../../../components/RelatedProducts';
import type { Review } from '../../../components/ProductReviews/utils';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';
import type { Product } from './types';
import {
  PDP_CONTENT_SHELL_CLASS,
  PDP_RELATED_SECTION_GAP_CLASS,
} from '@/constants/pdp-figma-tokens';

const PDP_REVIEWS_SHELL_CLASS = PDP_CONTENT_SHELL_CLASS;

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
  initialRelatedProducts: RelatedCardPayload[];
  serverLocale: StorefrontLocale;
  reviewsSectionRef: RefCallback<HTMLDivElement>;
  reviews: Review[];
  reviewsLoading: boolean;
  setReviews: Dispatch<SetStateAction<Review[]>>;
}

/**
 * Below-fold PDP sections — related carousel SSR-hydrated; reviews lazy-loaded.
 */
export function ProductPageBelowFold({
  slug,
  product,
  initialRelatedProducts,
  serverLocale,
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
          initialProducts={initialRelatedProducts}
          initialLanguage={serverLocale}
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

import { getProductPageData } from '@/lib/services/products-slug/get-product-page-data';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { ProductPageClient } from './ProductPageClient';
import type { Product } from './types';
import { mapProductToVisualSnapshot } from './utils/map-visual-payload-to-snapshot';

export interface ProductPageContentProps {
  slug: string;
  variantIdFromUrl: string | null;
  serverLocale: StorefrontLocale;
}

const EMPTY_REVIEW_SUMMARY = { count: 0, averageRating: 0 };

/**
 * Single SSR fetch — Redis bundle hit avoids DB; review summary hydrates client-side.
 */
export async function ProductPageContent({
  slug,
  variantIdFromUrl,
  serverLocale,
}: ProductPageContentProps) {
  const pageData = await getProductPageData(slug, serverLocale);

  if (pageData.status === 'not_found') {
    return (
      <ProductPageClient
        slug={slug}
        variantIdFromUrl={variantIdFromUrl}
        initialVisual={null}
        initialProduct={null}
        initialReviewSummary={EMPTY_REVIEW_SUMMARY}
        initialNotFound
        serverLocale={serverLocale}
      />
    );
  }

  const product = pageData.product as Product;

  return (
    <ProductPageClient
      slug={slug}
      variantIdFromUrl={variantIdFromUrl}
      initialVisual={mapProductToVisualSnapshot(product)}
      initialProduct={product}
      initialReviewSummary={pageData.reviewSummary}
      initialNotFound={false}
      serverLocale={serverLocale}
    />
  );
}

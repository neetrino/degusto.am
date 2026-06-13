import { getProductPageData } from '@/lib/services/products-slug/get-product-page-data';
import { getRelatedProductsForPdp } from '@/lib/services/products-slug/get-related-products-cached';
import { getProductVisualCached } from '@/lib/services/products-slug/get-product-visual-cached';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { ProductPageClient } from './ProductPageClient';
import { ProductDetailsServer } from './ProductDetailsServer';
import type { Product } from './types';
import {
  mapProductToVisualSnapshot,
  mapVisualPayloadToSnapshot,
} from './utils/map-visual-payload-to-snapshot';

export interface ProductPageContentProps {
  slug: string;
  variantIdFromUrl: string | null;
  serverLocale: StorefrontLocale;
}

const EMPTY_REVIEW_SUMMARY = { count: 0, averageRating: 0 };

/**
 * SSR fetch — product bundle + related carousel in parallel; reviews hydrate client-side.
 */
export async function ProductPageContent({
  slug,
  variantIdFromUrl,
  serverLocale,
}: ProductPageContentProps) {
  const [visualPayload, initialRelatedProducts] = await Promise.all([
    getProductVisualCached(slug, serverLocale),
    getRelatedProductsForPdp(slug, serverLocale),
  ]);

  if (!visualPayload) {
    const pageData = await getProductPageData(slug, serverLocale);
    if (pageData.status === 'not_found') {
      return (
        <ProductPageClient
          slug={slug}
          variantIdFromUrl={variantIdFromUrl}
          initialVisual={null}
          initialProduct={null}
          initialReviewSummary={EMPTY_REVIEW_SUMMARY}
          initialRelatedProducts={[]}
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
        initialRelatedProducts={initialRelatedProducts}
        initialNotFound={false}
        serverLocale={serverLocale}
      />
    );
  }

  const visualSnapshot = mapVisualPayloadToSnapshot(visualPayload);

  return (
    <ProductPageClient
      slug={slug}
      variantIdFromUrl={variantIdFromUrl}
      initialVisual={visualSnapshot}
      initialProduct={null}
      initialReviewSummary={EMPTY_REVIEW_SUMMARY}
      initialRelatedProducts={initialRelatedProducts}
      initialNotFound={false}
      serverLocale={serverLocale}
      streamDetails
    >
      <ProductDetailsServer slug={slug} locale={serverLocale} />
    </ProductPageClient>
  );
}

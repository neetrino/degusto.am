import { getProductPageData } from '@/lib/services/products-slug/get-product-page-data';
import { getProductVisualCached } from '@/lib/services/products-slug/get-product-visual-cached';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import { Suspense } from 'react';
import { ProductPageClient } from './ProductPageClient';
import { ProductDetailsServer } from './ProductDetailsServer';
import type { Product } from './types';
import { logger } from '@/lib/utils/logger';
import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';
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
  let visualPayload = null;
  const initialRelatedProducts: RelatedCardPayload[] = [];
  try {
    visualPayload = await getProductVisualCached(slug, serverLocale);
  } catch (error: unknown) {
    logger.warn('[PDP] Failed to load visual payload', {
      slug,
      locale: serverLocale,
      error: error instanceof Error ? error.message : String(error),
    });
  }
  logger.info('[PDP PERF] visual payload resolved', {
    slug,
    locale: serverLocale,
    hit: Boolean(visualPayload),
  });

  if (!visualPayload) {
    let pageData: Awaited<ReturnType<typeof getProductPageData>> | null = null;
    try {
      pageData = await getProductPageData(slug, serverLocale);
    } catch (error: unknown) {
      logger.error('[PDP] Failed to load full product page data', {
        slug,
        locale: serverLocale,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    logger.info('[PDP PERF] full page data fallback resolved', {
      slug,
      locale: serverLocale,
      hit: Boolean(pageData),
    });
    if (!pageData) {
      return (
        <ProductPageClient
          slug={slug}
          variantIdFromUrl={variantIdFromUrl}
          initialVisual={null}
          initialProduct={null}
          initialReviewSummary={EMPTY_REVIEW_SUMMARY}
          initialRelatedProducts={initialRelatedProducts}
          initialNotFound
          serverLocale={serverLocale}
        />
      );
    }
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
      <Suspense fallback={null}>
        <ProductDetailsServer slug={slug} locale={serverLocale} />
      </Suspense>
    </ProductPageClient>
  );
}

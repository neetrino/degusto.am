import { getProductPageData } from '@/lib/services/products-slug/get-product-page-data';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { Product } from './types';
import { ProductDetailsNotFoundSetter, ProductDetailsSetter } from './ProductDetailsSetter';
import { logger } from '@/lib/utils/logger';

interface ProductDetailsServerProps {
  slug: string;
  locale: StorefrontLocale;
}

/**
 * Slow path: full product + review summary (streamed after visual shell).
 */
export async function ProductDetailsServer({ slug, locale }: ProductDetailsServerProps) {
  let result: Awaited<ReturnType<typeof getProductPageData>> | null = null;
  try {
    result = await getProductPageData(slug, locale);
  } catch (error: unknown) {
    logger.error('[PDP] Product details stream failed', {
      slug,
      locale,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (!result) {
    return <ProductDetailsNotFoundSetter />;
  }

  if (result.status === 'not_found') {
    return <ProductDetailsNotFoundSetter />;
  }

  return (
    <ProductDetailsSetter
      product={result.product as Product}
      reviewSummary={result.reviewSummary}
    />
  );
}

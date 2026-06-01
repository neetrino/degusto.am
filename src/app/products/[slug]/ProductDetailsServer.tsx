import { getProductPageData } from '@/lib/services/products-slug/get-product-page-data';
import type { StorefrontLocale } from '@/lib/i18n/locale';
import type { Product } from './types';
import { ProductDetailsNotFoundSetter, ProductDetailsSetter } from './ProductDetailsSetter';

interface ProductDetailsServerProps {
  slug: string;
  locale: StorefrontLocale;
}

/**
 * Slow path: full product + review summary (streamed after visual shell).
 */
export async function ProductDetailsServer({ slug, locale }: ProductDetailsServerProps) {
  const result = await getProductPageData(slug, locale);

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

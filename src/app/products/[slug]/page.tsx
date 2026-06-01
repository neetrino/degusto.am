import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getProductPageData } from '@/lib/services/products-slug/get-product-page-data';
import { getProductVisualCached } from '@/lib/services/products-slug/get-product-visual-cached';
import { ProductPageClient } from './ProductPageClient';
import { parseProductSlugParam } from './parse-product-slug-param';
import { RESERVED_ROUTES } from './types';
import type { Product } from './types';
import type { ProductVisualSnapshot } from './utils/merge-visual-into-product';
import type { RelatedCardPayload } from '@/lib/services/products-slug/product-related-transform';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const { slug, variantIdFromUrl } = parseProductSlugParam(rawSlug);

  if (slug && RESERVED_ROUTES.includes(slug.toLowerCase())) {
    redirect(`/${slug}`);
  }

  const cookieStore = await cookies();
  const serverLocale = resolveStorefrontLocaleFromCookie(
    cookieStore.get('shop_language')?.value
  );

  const [visual, pageData] = await Promise.all([
    getProductVisualCached(slug, serverLocale),
    getProductPageData(slug, serverLocale),
  ]);

  const initialVisual: ProductVisualSnapshot | null = visual
    ? {
        id: visual.id,
        slug: visual.slug,
        title: visual.title,
        galleryImages: visual.galleryImages,
        seo: visual.seo,
      }
    : null;

  const initialProduct =
    pageData.status === 'ok' ? (pageData.product as Product) : null;
  const initialReviewSummary =
    pageData.status === 'ok'
      ? pageData.reviewSummary
      : { count: 0, averageRating: 0 };
  const initialReviews =
    pageData.status === 'ok' ? pageData.initialReviews : [];
  const initialRelatedProducts: RelatedCardPayload[] =
    pageData.status === 'ok' ? pageData.initialRelatedProducts : [];
  const initialNotFound = pageData.status === 'not_found';

  return (
    <ProductPageClient
      slug={slug}
      variantIdFromUrl={variantIdFromUrl}
      initialVisual={initialVisual}
      initialProduct={initialProduct}
      initialReviewSummary={initialReviewSummary}
      initialReviews={initialReviews}
      initialRelatedProducts={initialRelatedProducts}
      initialNotFound={initialNotFound}
      serverLocale={serverLocale}
    />
  );
}

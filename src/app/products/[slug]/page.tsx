import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getProductVisualCached } from '@/lib/services/products-slug/get-product-visual-cached';
import { ProductPageClient } from './ProductPageClient';
import { ProductDetailsServer } from './ProductDetailsServer';
import { parseProductSlugParam } from './parse-product-slug-param';
import { RESERVED_ROUTES } from './types';
import type { ProductVisualSnapshot } from './utils/merge-visual-into-product';

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

  const visual = await getProductVisualCached(slug, serverLocale);

  const initialVisual: ProductVisualSnapshot | null = visual
    ? {
        id: visual.id,
        slug: visual.slug,
        title: visual.title,
        galleryImages: visual.galleryImages,
        seo: visual.seo,
      }
    : null;

  return (
    <ProductPageClient
      slug={slug}
      variantIdFromUrl={variantIdFromUrl}
      initialVisual={initialVisual}
      serverLocale={serverLocale}
    >
      <Suspense fallback={null}>
        <ProductDetailsServer slug={slug} locale={serverLocale} />
      </Suspense>
    </ProductPageClient>
  );
}

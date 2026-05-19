import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getProductPageData } from '@/lib/services/products-slug/get-product-page-data';
import { ProductPageClient } from './ProductPageClient';
import { parseProductSlugParam } from './parse-product-slug-param';
import { RESERVED_ROUTES } from './types';
import type { Product } from './types';

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

  const result = await getProductPageData(slug, serverLocale);

  return (
    <ProductPageClient
      slug={slug}
      variantIdFromUrl={variantIdFromUrl}
      initialProduct={result.status === 'ok' ? (result.product as Product) : null}
      initialNotFound={result.status === 'not_found'}
      serverLocale={serverLocale}
    />
  );
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { ProductPageContent } from './ProductPageContent';
import { parseProductSlugParam } from './parse-product-slug-param';
import { RESERVED_ROUTES } from './types';

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

  return (
    <ProductPageContent
      slug={slug}
      variantIdFromUrl={variantIdFromUrl}
      serverLocale={serverLocale}
    />
  );
}

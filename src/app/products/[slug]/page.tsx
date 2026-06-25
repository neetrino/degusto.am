import { redirect } from 'next/navigation';
import { PRIMARY_LOCALE } from '@/lib/i18n/locale';
import { ProductPageContent } from './ProductPageContent';
import { parseProductSlugParam } from './parse-product-slug-param';
import { RESERVED_ROUTES } from './types';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Keep in sync with `STOREFRONT_ISR_REVALIDATE_SECONDS` in `@/constants/storefront-isr`. */
export const revalidate = 86_400;

export default async function ProductPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const { slug, variantIdFromUrl } = parseProductSlugParam(rawSlug);

  if (slug && RESERVED_ROUTES.includes(slug.toLowerCase())) {
    redirect(`/${slug}`);
  }

  return (
    <ProductPageContent
      slug={slug}
      variantIdFromUrl={variantIdFromUrl}
      serverLocale={PRIMARY_LOCALE}
    />
  );
}

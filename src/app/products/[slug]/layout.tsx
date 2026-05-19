import type { Metadata } from "next";
import { cookies } from "next/headers";
import { resolveStorefrontLocaleFromCookie } from "@/lib/i18n/locale";
import { getProductMetadataFallbackCopy } from "@/lib/i18n/metadata";
import { getProductPageData } from "@/lib/services/products-slug/get-product-page-data";
import { parseProductSlugParam } from "./parse-product-slug-param";

const SITE_NAME = "WhiteShop.am";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const { slug } = parseProductSlugParam(rawSlug);
  const cookieStore = await cookies();
  const locale = resolveStorefrontLocaleFromCookie(cookieStore.get("shop_language")?.value);
  const fallback = getProductMetadataFallbackCopy(locale);
  try {
    const result = await getProductPageData(slug, locale);
    if (result.status !== "ok") {
      return {
        title: `${fallback.notFound} | ${SITE_NAME}`,
      };
    }
    const product = result.product;
    const title = product.seo?.title || product.title || fallback.title;
    const description = product.seo?.description || product.description || null;
    const firstImage =
      Array.isArray(product.media) && product.media.length > 0
        ? String(product.media[0])
        : null;

    return {
      title: `${title} | ${SITE_NAME}`,
      description: description ?? undefined,
      openGraph: {
        title,
        description: description ?? undefined,
        ...(firstImage && { images: [{ url: firstImage, alt: title }] }),
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: description ?? undefined,
        ...(firstImage && { images: [firstImage] }),
      },
    };
  } catch {
    return {
      title: `${fallback.notFound} | ${SITE_NAME}`,
    };
  }
}


export default function ProductSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

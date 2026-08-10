import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { getEnv } from "@/config/env";
import { getProductDetailBySlug } from "@/features/products/queries";
import { ProductDetailView } from "@/features/products/ui/ProductDetailView";
import { ProductRelatedSection } from "@/features/products/ui/ProductRelatedSection";
import { ProductReviewsIsland } from "@/features/products/ui/ProductReviewsIsland";
import { isProductInWishlist } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  createDisplayPriceFormatter,
  type DisplayPrice,
  getSelectedCurrency,
} from "@/lib/money/display-price";

type ProductPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

function buildProductJsonLd(input: {
  locale: Locale;
  slug: string;
  title: string;
  description?: string;
  sku: string;
  priceAmount: number;
  imageUrl: string | null;
  inStock: boolean;
}): Record<string, unknown> {
  const appUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const url = `${appUrl}/${input.locale}/products/${input.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    sku: input.sku,
    url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "AMD",
      price: String(input.priceAmount),
      availability: input.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

function formatCardPrice(price: DisplayPrice): string {
  if (price.displayCurrency === "AMD") {
    return `${price.displayAmount.toString()} Դ`;
  }
  return price.formatted;
}

function firstPhoneHref(phones: string): string {
  const match = phones.match(/\d[\d\s()-]{5,}/);
  if (!match) {
    return "tel:+37460388080";
  }
  const digits = match[0].replace(/\D/g, "");
  return `tel:+${digits.startsWith("0") ? `374${digits.slice(1)}` : digits}`;
}

function SectionFallback() {
  return (
    <div
      className="h-40 animate-pulse rounded-lg bg-gray-100"
      aria-hidden="true"
    />
  );
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    return {};
  }

  const product = await getProductDetailBySlug(rawLocale, slug);
  if (!product) {
    return {};
  }

  const title = product.translation.seoTitle ?? product.translation.title;
  const description =
    product.translation.seoDescription ?? product.translation.description;
  const canonicalPath = `/${rawLocale}/products/${product.translation.slug}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalPath,
      ...(product.imageUrl ? { images: [{ url: product.imageUrl }] } : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale: rawLocale, slug } = await params;
  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const product = await getProductDetailBySlug(locale, slug);
  if (!product) {
    notFound();
  }

  // Locale switcher only rewrites /{locale}/… and keeps the previous slug.
  // Degusto products have distinct hy/en/ru slugs — canonicalize when needed.
  if (product.translation.slug !== decodeURIComponent(slug)) {
    redirect(`/${locale}/products/${product.translation.slug}`);
  }

  const [user, currency, inWishlist] = await Promise.all([
    getCurrentUser(),
    getSelectedCurrency(),
    isProductInWishlist(product.id),
  ]);
  const formatPrice = await createDisplayPriceFormatter(locale, currency);
  const price = formatPrice(product.priceAmount);
  const compareAt =
    product.compareAtAmount != null
      ? formatPrice(product.compareAtAmount)
      : null;

  const jsonLd = buildProductJsonLd({
    locale,
    slug: product.translation.slug,
    title: product.translation.title,
    description: product.translation.description,
    sku: product.sku,
    priceAmount: product.priceAmount,
    imageUrl: product.images[0]?.url ?? product.imageUrl,
    inStock: product.stockOnHand > 0,
  });

  const isSignedIn = Boolean(user);

  const relatedProps = {
    locale,
    productId: product.id,
    currency,
    isSignedIn,
    dictionary,
  };

  const reviewsProps = {
    locale,
    productId: product.id,
    productSlug: product.translation.slug,
    userId: user?.id,
    isSignedIn,
    dictionary,
  };

  return (
    <ProductDetailView
      locale={locale}
      product={product}
      priceFormatted={formatCardPrice(price)}
      compareAtFormatted={
        compareAt ? formatCardPrice(compareAt) : null
      }
      isSignedIn={isSignedIn}
      inWishlist={inWishlist}
      dictionary={dictionary}
      jsonLd={jsonLd}
      mobileChrome={{
        locale,
        currency,
        brand: dictionary.brand,
        callLabel: dictionary.home.call,
        phoneHref: firstPhoneHref(dictionary.footer.phones),
        currencyLabel: dictionary.header.currency,
        languageLabel: dictionary.header.language,
        searchLabel: dictionary.header.search,
        searchPlaceholder: dictionary.header.search,
      }}
      relatedSlot={
        <Suspense fallback={<SectionFallback />}>
          <ProductRelatedSection {...relatedProps} />
        </Suspense>
      }
      reviewsSlot={
        <Suspense fallback={<SectionFallback />}>
          <ProductReviewsIsland {...reviewsProps} />
        </Suspense>
      }
      relatedSlotDesktop={
        <Suspense fallback={<SectionFallback />}>
          <ProductRelatedSection {...relatedProps} />
        </Suspense>
      }
      reviewsSlotDesktop={
        <Suspense fallback={<SectionFallback />}>
          <ProductReviewsIsland {...reviewsProps} />
        </Suspense>
      }
    />
  );
}

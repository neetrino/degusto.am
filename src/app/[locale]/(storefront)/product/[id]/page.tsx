import { redirectLegacyProductPage } from "@/features/products/application/legacy-product-redirect-page";

type LocaleLegacyProductPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

/** Locale-prefixed `/hy/product/:id` after the proxy has already added a locale. */
export default async function LocaleLegacyProductIdPage({
  params,
}: LocaleLegacyProductPageProps) {
  const { locale, id } = await params;
  await redirectLegacyProductPage(locale, id);
}

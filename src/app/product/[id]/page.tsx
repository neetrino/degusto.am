import { redirectLegacyProductPage } from "@/features/products/application/legacy-product-redirect-page";
import { defaultLocale } from "@/lib/i18n/config";

type LegacyProductPageProps = {
  params: Promise<{ id: string }>;
};

/** Unprefixed `/product/:id` — proxy skips locale prefix so this 308s in one hop. */
export default async function LegacyProductIdPage({
  params,
}: LegacyProductPageProps) {
  const { id } = await params;
  await redirectLegacyProductPage(defaultLocale, id);
}

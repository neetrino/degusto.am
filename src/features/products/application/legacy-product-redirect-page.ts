import { permanentRedirect } from "next/navigation";

import { resolveLegacyProductRedirect } from "@/features/products/application/resolve-legacy-product";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

/** Looks up an old product id, then 308s to the PDP or catalog. */
export async function redirectLegacyProductPage(
  locale: string,
  id: string,
): Promise<never> {
  const resolvedLocale = isLocale(locale) ? locale : defaultLocale;
  permanentRedirect(await resolveLegacyProductRedirect(resolvedLocale, id));
}

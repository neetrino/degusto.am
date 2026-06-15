import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  readJsonCache,
  STOREFRONT_CACHE_KEYS,
  STOREFRONT_CACHE_TTL,
  writeJsonCache,
} from "@/lib/cache/storefront-cache";
import type { StorefrontLocale } from "@/lib/i18n/locale";
import { getShopMenuProductsPage } from "@/lib/services/shop-page/shop-page-data.service";
import {
  findRelatedByProductSlug,
  resolveProductRelatedContextBySlug,
} from "./product-related.service";
import type { RelatedCardPayload } from "./product-related-transform";
import { pdpPageCacheTag } from "./get-product-page-data";
import type { MenuCard } from "@/components/home/menu-types";

async function loadRelatedProductsUncached(
  slug: string,
  locale: StorefrontLocale
): Promise<RelatedCardPayload[]> {
  const cacheKey = STOREFRONT_CACHE_KEYS.productRelated(locale, slug);
  const cached = await readJsonCache<{ data: RelatedCardPayload[] }>(cacheKey);
  if (cached?.data) {
    return cached.data;
  }

  const context = await resolveProductRelatedContextBySlug(slug, locale);
  if (!context) {
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productRelated, { data: [] as RelatedCardPayload[] });
    return [];
  }

  if (context.primaryCategorySlug) {
    const shopPage = await getShopMenuProductsPage({
      locale,
      selectedCategorySlug: context.primaryCategorySlug,
      selectedSearchQuery: "",
      tasteFilter: null,
      minPriceAmd: null,
      maxPriceAmd: null,
      requestedPage: 1,
    });

    const data = mapShopCardsToRelatedPayload(shopPage.cards)
      .filter((item) => item.id !== context.productId && item.slug.length > 0)
      .slice(0, 10);
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productRelated, { data });
    return data;
  }

  const body = await findRelatedByProductSlug(slug, locale);
  await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productRelated, body);
  return body.data;
}

function mapShopCardsToRelatedPayload(cards: MenuCard[]): RelatedCardPayload[] {
  return cards.map((card) => ({
    id: card.id,
    slug: card.slug,
    title: card.title ?? "",
    price: card.price,
    originalPrice: card.oldPrice > card.price ? card.oldPrice : null,
    compareAtPrice: card.oldPrice > card.price ? card.oldPrice : null,
    discountPercent: card.discountPercent ?? null,
    defaultVariantId: card.defaultVariantId ?? null,
    image: card.image ?? null,
    inStock: card.inStock ?? true,
    categories: [],
  }));
}

/**
 * SSR + Data Cache + Redis for PDP related carousel (same payload as `/related` API).
 */
export function getRelatedProductsForPdp(
  slug: string,
  locale: StorefrontLocale
): Promise<RelatedCardPayload[]> {
  return cache(async (s: string, l: StorefrontLocale) => {
    return unstable_cache(
      () => loadRelatedProductsUncached(s, l),
      ["pdp-related-v1", s, l],
      {
        revalidate: STOREFRONT_CACHE_TTL.productRelated,
        tags: [pdpPageCacheTag(s)],
      }
    )();
  })(slug, locale);
}

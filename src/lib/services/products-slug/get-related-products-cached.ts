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
import { withPrismaResilience } from "@/lib/db/with-prisma-resilience";
import {
  findRelatedByProductSlug,
  resolveProductRelatedContextBySlug,
} from "./product-related.service";
import type { RelatedCardPayload } from "./product-related-transform";
import { pdpPageCacheTag } from "./get-product-page-data";
import type { MenuCard } from "@/components/home/menu-types";

const PDP_RELATED_BATCH_SIZE = 5;
const PDP_RELATED_MAX = 10;

const PDP_RELATED_RESILIENCE_SCOPE = "PDP_RELATED";
const PDP_RELATED_RESILIENCE_STEP = "load related products";

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
    const categoryCacheKey = STOREFRONT_CACHE_KEYS.productRelatedCategory(
      locale,
      context.primaryCategorySlug
    );
    const cachedCategory = await readJsonCache<{ data: RelatedCardPayload[] }>(categoryCacheKey);
    if (cachedCategory?.data) {
      const data = cachedCategory.data
        .filter((item) => item.id !== context.productId && item.slug.length > 0)
        .slice(0, PDP_RELATED_MAX);
      await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productRelated, { data });
      return data;
    }

    const firstPage = await getShopMenuProductsPage({
      locale,
      selectedCategorySlug: context.primaryCategorySlug,
      selectedSearchQuery: "",
      tasteFilter: null,
      minPriceAmd: null,
      maxPriceAmd: null,
      requestedPage: 1,
    });
    const aggregatedCards = [...firstPage.cards];
    let page = 2;
    while (aggregatedCards.length < PDP_RELATED_MAX && page <= firstPage.totalPages) {
      const nextPage = await getShopMenuProductsPage({
        locale,
        selectedCategorySlug: context.primaryCategorySlug,
        selectedSearchQuery: "",
        tasteFilter: null,
        minPriceAmd: null,
        maxPriceAmd: null,
        requestedPage: page,
      });
      aggregatedCards.push(...nextPage.cards);
      page += 1;
    }

    const categoryData = mapShopCardsToRelatedPayload(aggregatedCards)
      .filter((item) => item.slug.length > 0)
      .slice(0, PDP_RELATED_MAX);
    await writeJsonCache(categoryCacheKey, STOREFRONT_CACHE_TTL.productRelated, {
      data: categoryData,
    });

    const data = categoryData
      .filter((item) => item.id !== context.productId && item.slug.length > 0)
      .slice(0, PDP_RELATED_MAX);
    await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productRelated, { data });
    return data;
  }

  const body = await findRelatedByProductSlug(slug, locale);
  const limited = body.data.slice(0, PDP_RELATED_MAX);
  await writeJsonCache(cacheKey, STOREFRONT_CACHE_TTL.productRelated, { data: limited });
  return limited;
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
    rating: card.rating ?? 5,
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
      () =>
        withPrismaResilience(
          () => loadRelatedProductsUncached(s, l),
          [] as RelatedCardPayload[],
          PDP_RELATED_RESILIENCE_SCOPE,
          PDP_RELATED_RESILIENCE_STEP
        ),
      ["pdp-related-v2", s, l],
      {
        revalidate: STOREFRONT_CACHE_TTL.productRelated,
        tags: [pdpPageCacheTag(s)],
      }
    )();
  })(slug, locale).then((items) => items.slice(0, PDP_RELATED_BATCH_SIZE));
}

export async function getRelatedProductsBatchForPdp(
  slug: string,
  locale: StorefrontLocale,
  offset: number,
  limit: number
): Promise<{ data: RelatedCardPayload[]; total: number }> {
  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.min(Math.max(1, limit), PDP_RELATED_BATCH_SIZE);
  const pool = await cache(async (s: string, l: StorefrontLocale) => {
    return unstable_cache(
      () =>
        withPrismaResilience(
          () => loadRelatedProductsUncached(s, l),
          [] as RelatedCardPayload[],
          PDP_RELATED_RESILIENCE_SCOPE,
          PDP_RELATED_RESILIENCE_STEP
        ),
      ["pdp-related-v2", s, l],
      {
        revalidate: STOREFRONT_CACHE_TTL.productRelated,
        tags: [pdpPageCacheTag(s)],
      }
    )();
  })(slug, locale);
  const capped = pool.slice(0, PDP_RELATED_MAX);
  return {
    data: capped.slice(safeOffset, safeOffset + safeLimit),
    total: capped.length,
  };
}

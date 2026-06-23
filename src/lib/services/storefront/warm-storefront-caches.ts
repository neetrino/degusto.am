import { logger } from '@/lib/utils/logger';
import { PRIMARY_LOCALE, STOREFRONT_LOCALES, type StorefrontLocale } from '@/lib/i18n/locale';
import { getComboMenuData } from '@/lib/services/combo-page/combo-page-data.service';
import { getHomePageData } from '@/lib/services/home-page-data.service';
import { warmProductPageCaches } from '@/lib/services/products-slug/warm-product-page-caches';
import { getShopMenuData } from '@/lib/services/shop-page/shop-page-data.service';

const WARM_CONCURRENCY = 3;
const TOP_PDP_WARM_LIMIT = 12;

async function runBounded<T>(
  items: readonly T[],
  worker: (item: T) => Promise<void>,
  concurrency: number
): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const queue = [...items];
  const poolSize = Math.min(concurrency, queue.length);
  const runners = Array.from({ length: poolSize }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item !== undefined) {
        await worker(item);
      }
    }
  });
  await Promise.all(runners);
}

async function warmHomeLocales(): Promise<void> {
  await runBounded(
    STOREFRONT_LOCALES,
    async (locale) => {
      await getHomePageData(locale);
    },
    WARM_CONCURRENCY
  );
}

async function warmDefaultShopMenu(locale: StorefrontLocale): Promise<void> {
  await getShopMenuData({
    locale,
    selectedCategorySlug: '',
    selectedSearchQuery: '',
    tasteFilter: null,
    minPriceAmd: null,
    maxPriceAmd: null,
    requestedPage: 1,
    loadProfile: 'full',
  });
}

async function warmDefaultComboMenu(locale: StorefrontLocale): Promise<void> {
  await getComboMenuData({
    locale,
    selectedCategorySlug: '',
    selectedSearchQuery: '',
    tasteFilter: null,
    minPriceAmd: null,
    maxPriceAmd: null,
    requestedPage: 1,
  });
}

/**
 * Pre-populate Data Cache + Redis for hot storefront routes (bounded concurrency).
 */
export async function warmStorefrontCaches(): Promise<void> {
  const startedAt = Date.now();

  await warmHomeLocales();
  await runBounded(
    STOREFRONT_LOCALES,
    async (locale) => {
      await warmDefaultShopMenu(locale);
      await warmDefaultComboMenu(locale);
    },
    WARM_CONCURRENCY
  );

  const home = await getHomePageData(PRIMARY_LOCALE);
  const slugs = home.featuredProducts
    .map((product) => product.slug.trim())
    .filter((slug) => slug.length > 0)
    .slice(0, TOP_PDP_WARM_LIMIT);

  if (slugs.length > 0) {
    await warmProductPageCaches(slugs);
  }

  logger.info('[CACHE WARM] Storefront warm completed', {
    durationMs: Date.now() - startedAt,
    locales: STOREFRONT_LOCALES.length,
    pdpSlugs: slugs.length,
  });
}

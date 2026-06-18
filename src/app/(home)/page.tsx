import { FigmaHomePageMobile } from '../../components/home/FigmaHomePageMobile';
import { FigmaHomePage } from '../../components/home/FigmaHomePage';
import { HomeVisibleRoutesWarmup } from '../../components/routing/HomeVisibleRoutesWarmup';
import { getHomeCategoryHref } from '../../components/home/homeCategoryLinks';
import { cookies } from 'next/headers';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getHomePageData } from '@/lib/services/home-page-data.service';

/** Pre-render home at build time; keep in sync with HOME_PAGE_REVALIDATE_SECONDS. */
export const revalidate = 60;

export default async function HomePage() {
  const cookieStore = await cookies();
  const locale = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const { featuredProducts, categories, dailyOfferMobile, dailyOfferDesktop } =
    await getHomePageData(locale);

  const categoryHrefs = categories.map((category) =>
    getHomeCategoryHref({ slug: category.slug, title: category.title })
  );
  const productSlugs = featuredProducts.map((product) => product.slug);

  return (
    <>
      <HomeVisibleRoutesWarmup categoryHrefs={categoryHrefs} productSlugs={productSlugs} />
      <FigmaHomePageMobile
        lang={locale}
        categories={categories}
        featuredProducts={featuredProducts}
        dailyOfferProduct={dailyOfferMobile}
      />
      <FigmaHomePage
        categories={categories}
        featuredProducts={featuredProducts}
        dailyOfferProduct={dailyOfferDesktop}
      />
    </>
  );
}

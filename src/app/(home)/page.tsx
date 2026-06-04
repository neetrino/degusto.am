import { FigmaHomePageMobile } from '../../components/home/FigmaHomePageMobile';
import { FigmaHomePage } from '../../components/home/FigmaHomePage';
import { HomeVisibleRoutesWarmup } from '../../components/routing/HomeVisibleRoutesWarmup';
import { getHomeCategoryHref } from '../../components/home/homeCategoryLinks';
import { PRIMARY_LOCALE } from '@/lib/i18n/locale';
import { getHomePageData } from '@/lib/services/home-page-data.service';

/** Pre-render home at build time; keep in sync with HOME_PAGE_REVALIDATE_SECONDS. */
export const revalidate = 60;

export default async function HomePage() {
  const { featuredProducts, categories, dailyOfferMobile, dailyOfferDesktop } =
    await getHomePageData(PRIMARY_LOCALE);

  const categoryHrefs = categories.map((category) =>
    getHomeCategoryHref({ slug: category.slug, title: category.title })
  );
  const productSlugs = featuredProducts.map((product) => product.slug);

  return (
    <>
      <HomeVisibleRoutesWarmup categoryHrefs={categoryHrefs} productSlugs={productSlugs} />
      <FigmaHomePageMobile
        lang={PRIMARY_LOCALE}
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

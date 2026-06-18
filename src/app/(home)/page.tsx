import { headers } from 'next/headers';
import { FigmaHomePageMobile } from '../../components/home/FigmaHomePageMobile';
import { HomePageResponsiveShell } from '../../components/home/HomePageResponsiveShell';
import { HomeVisibleRoutesWarmup } from '../../components/routing/HomeVisibleRoutesWarmup';
import { getHomeCategoryHref } from '../../components/home/homeCategoryLinks';
import { cookies } from 'next/headers';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getHomePageData } from '@/lib/services/home-page-data.service';
import { isMobileUserAgent } from '@/lib/viewport';

/** Pre-render home at build time; keep in sync with HOME_PAGE_REVALIDATE_SECONDS. */
export const revalidate = 60;

export default async function HomePage() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const initialIsMobile = isMobileUserAgent(requestHeaders.get('user-agent'));
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
      <HomePageResponsiveShell
        initialIsMobile={initialIsMobile}
        categories={categories}
        featuredProducts={featuredProducts}
        dailyOfferProduct={dailyOfferDesktop}
        mobile={
          <FigmaHomePageMobile
            lang={locale}
            categories={categories}
            featuredProducts={featuredProducts}
            dailyOfferProduct={dailyOfferMobile}
          />
        }
      />
    </>
  );
}

import { cookies } from 'next/headers';
import { FigmaHomePageMobile } from '../../components/home/FigmaHomePageMobile';
import { FigmaHomePage } from '../../components/home/FigmaHomePage';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getHomePageData } from '@/lib/services/home-page-data.service';
import {
  resolveHomeCategories,
  resolveHomeFeaturedProducts,
} from '../../components/home/home-page-fallbacks';

export default async function HomePage() {
  const cookieStore = await cookies();
  const homeLang = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const { featuredProducts, categories, dailyOfferMobile, dailyOfferDesktop } = await getHomePageData(homeLang);
  const homeFeaturedProducts = resolveHomeFeaturedProducts(featuredProducts);
  const homeCategories = resolveHomeCategories(categories);

  return (
    <>
      <FigmaHomePageMobile
        lang={homeLang}
        categories={homeCategories}
        featuredProducts={homeFeaturedProducts}
        dailyOfferProduct={dailyOfferMobile}
      />
      <FigmaHomePage
        categories={homeCategories}
        featuredProducts={homeFeaturedProducts}
        dailyOfferProduct={dailyOfferDesktop}
      />
    </>
  );
}

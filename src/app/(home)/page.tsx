import { cookies } from 'next/headers';
import { FigmaHomePageMobile } from '../../components/home/FigmaHomePageMobile';
import { FigmaHomePage } from '../../components/home/FigmaHomePage';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getHomePageData } from '@/lib/services/home-page-data.service';

export default async function HomePage() {
  const cookieStore = await cookies();
  const homeLang = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const { featuredProducts, categories, dailyOfferMobile, dailyOfferDesktop } =
    await getHomePageData(homeLang);

  return (
    <>
      <FigmaHomePageMobile
        lang={homeLang}
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

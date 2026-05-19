import { cookies } from 'next/headers';
import { FigmaHomePage } from '../components/home/FigmaHomePage';
import { resolveStorefrontLocaleFromCookie } from '@/lib/i18n/locale';
import { getHomePageData } from '@/lib/services/home-page-data.service';

export default async function HomePage() {
  const cookieStore = await cookies();
  const homeLang = resolveStorefrontLocaleFromCookie(cookieStore.get('shop_language')?.value);
  const { featuredProducts, categories } = await getHomePageData(homeLang);

  return <FigmaHomePage featuredProducts={featuredProducts} categories={categories} />;
}

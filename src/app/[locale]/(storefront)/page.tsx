import { notFound } from "next/navigation";

import { listStorefrontCategories } from "@/features/categories/application/list-storefront-categories";
import { listActiveHeroSlides } from "@/features/hero/application/queries";
import { HomeCategories } from "@/features/home/ui/HomeCategories";
import { HomeFeaturedProducts } from "@/features/home/ui/HomeFeaturedProducts";
import { HomeHero } from "@/features/home/ui/HomeHero";
import {
  getFeaturedProducts,
  getPrimaryCategoryLabels,
} from "@/features/products/queries";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  createDisplayPriceFormatter,
  type DisplayPrice,
  getSelectedCurrency,
} from "@/lib/money/display-price";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

const HOME_FEATURED_LIMIT = 5;
const FEATURED_CARD_RATING = 4.7;

function formatProductCount(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

function compareAtDiscountPercent(
  priceAmount: number,
  compareAtAmount: number | null,
): number | null {
  if (compareAtAmount == null || compareAtAmount <= priceAmount) {
    return null;
  }

  return Math.round((1 - priceAmount / compareAtAmount) * 100);
}

function formatCardPrice(price: DisplayPrice): string {
  if (price.displayCurrency === "AMD") {
    return `${price.displayAmount.toString()} Դ`;
  }

  return price.formatted;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const dictionary = getDictionary(locale);
  const [heroSlides, featuredProducts, categories, currency, user] =
    await Promise.all([
      listActiveHeroSlides(locale),
      getFeaturedProducts(locale),
      listStorefrontCategories(locale),
      getSelectedCurrency(),
      getCurrentUser(),
    ]);

  const homeProducts = featuredProducts.slice(0, HOME_FEATURED_LIMIT);
  const [wishlistIds, formatPrice, categoryLabels] = await Promise.all([
    getWishlistProductIds(homeProducts.map((product) => product.id)),
    createDisplayPriceFormatter(locale, currency),
    getPrimaryCategoryLabels(
      homeProducts.map((product) => product.id),
      locale,
    ),
  ]);

  const featuredCards = homeProducts.map((product) => {
    const price = formatPrice(product.priceAmount);
    const compareAt =
      product.compareAtAmount != null
        ? formatPrice(product.compareAtAmount)
        : null;

    return {
      id: product.id,
      href: `/${locale}/products/${product.translation.slug}`,
      title: product.translation.title,
      priceFormatted: formatCardPrice(price),
      compareAtFormatted: compareAt ? formatCardPrice(compareAt) : null,
      discountPercent:
        product.discountPercent ??
        compareAtDiscountPercent(
          product.priceAmount,
          product.compareAtAmount,
        ),
      imageUrl: product.imageUrl,
      inStock: product.stockOnHand > 0,
      inWishlist: wishlistIds.has(product.id),
      categoryLabel: categoryLabels.get(product.id) ?? null,
      rating: FEATURED_CARD_RATING,
      isSpicy: true,
      isVegetarian: true,
    };
  });

  const dailyOffer = featuredCards[0] ?? null;

  const categoryCards = categories.map((category) => ({
    id: category.id,
    href: `/${locale}/products`,
    title: category.title,
    productCountLabel: formatProductCount(
      dictionary.home.productCount,
      category.productCount,
    ),
    imageUrl: category.imageUrl,
  }));

  return (
    <div className="-mx-4 -mt-[7.5rem] -mb-10 sm:-mx-6 lg:-mx-8">
      <HomeHero
        slides={heroSlides}
        fallbackTitle={dictionary.home.title}
        locale={locale}
        wishlistLabel={dictionary.nav.wishlist}
        addToCartLabel={dictionary.product.addToCart}
        outOfStockLabel={dictionary.product.outOfStock}
        dailyOfferLabel={dictionary.home.dailyOffer}
        isSignedIn={Boolean(user)}
        dailyOffer={dailyOffer}
      />

      <HomeFeaturedProducts
        locale={locale}
        titleLead={dictionary.home.featuredTitleLead}
        titleAccent={dictionary.home.featuredTitleAccent}
        viewAllLabel={dictionary.home.viewAll}
        viewAllHref={`/${locale}/products`}
        emptyLabel={dictionary.home.emptyFeatured}
        wishlistLabel={dictionary.nav.wishlist}
        addToCartLabel={dictionary.product.addToCart}
        outOfStockLabel={dictionary.product.outOfStock}
        isSignedIn={Boolean(user)}
        products={featuredCards}
      />

      <HomeCategories
        title={dictionary.home.categoriesTitle}
        emptyLabel={dictionary.home.emptyCategories}
        categories={categoryCards}
      />
    </div>
  );
}

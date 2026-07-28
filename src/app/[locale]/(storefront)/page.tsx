import { notFound } from "next/navigation";

import { listStorefrontCategories } from "@/features/categories/application/list-storefront-categories";
import { listActiveHeroSlides } from "@/features/hero/application/queries";
import { HomeCategories } from "@/features/home/ui/HomeCategories";
import { HomeFeaturedProducts } from "@/features/home/ui/HomeFeaturedProducts";
import { HomeHero } from "@/features/home/ui/HomeHero";
import { HomeMobile } from "@/features/home/ui/HomeMobile";
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
const HOME_DAILY_OFFERS_LIMIT = 12;
const FEATURED_CARD_RATING = 5;

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

function firstPhoneHref(phones: string): string {
  const match = phones.match(/\d[\d\s()-]{5,}/);
  if (!match) {
    return "tel:+37460388080";
  }

  const digits = match[0].replace(/\D/g, "");
  return `tel:+${digits.startsWith("0") ? `374${digits.slice(1)}` : digits}`;
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
  const dailyOfferProducts = featuredProducts.slice(0, HOME_DAILY_OFFERS_LIMIT);
  const cardSource = featuredProducts.slice(
    0,
    Math.max(HOME_FEATURED_LIMIT, HOME_DAILY_OFFERS_LIMIT),
  );

  const [wishlistIds, formatPrice, categoryLabels] = await Promise.all([
    getWishlistProductIds(cardSource.map((product) => product.id)),
    createDisplayPriceFormatter(locale, currency),
    getPrimaryCategoryLabels(
      cardSource.map((product) => product.id),
      locale,
    ),
  ]);

  function toCard(product: (typeof featuredProducts)[number]) {
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
  }

  const featuredCards = homeProducts.map(toCard);
  const dailyOfferCards = dailyOfferProducts.map(toCard);
  const dailyOffer = featuredCards[0] ?? null;

  const categoryCards = categories.map((category) => ({
    id: category.id,
    href: category.slug
      ? `/${locale}/products?category=${encodeURIComponent(category.slug)}`
      : `/${locale}/products`,
    title: category.title,
    productCountLabel: formatProductCount(
      dictionary.home.productCount,
      category.productCount,
    ),
    imageUrl: category.imageUrl,
  }));

  return (
    <div className="-mx-4 -mt-[7.5rem] -mb-10 sm:-mx-6 lg:-mx-8" data-home-page>
      <HomeMobile
        locale={locale}
        currency={currency}
        brand={dictionary.brand}
        callLabel={dictionary.home.call}
        phoneHref={firstPhoneHref(dictionary.footer.phones)}
        currencyLabel={dictionary.header.currency}
        languageLabel={dictionary.header.language}
        searchLabel={dictionary.header.search}
        searchPlaceholder={dictionary.header.search}
        categoriesTitle={dictionary.home.categoriesTitle}
        viewAllCategoriesLabel={dictionary.home.viewAllCategories}
        viewAllCategoriesHref={`/${locale}/products`}
        newProductsTitle={dictionary.home.newProductsTitle}
        viewAllHref={`/${locale}/products`}
        dailyOfferLabel={dictionary.home.dailyOffer}
        wishlistLabel={dictionary.nav.wishlist}
        addToCartLabel={dictionary.product.addToCart}
        outOfStockLabel={dictionary.product.outOfStock}
        isSignedIn={Boolean(user)}
        categories={categoryCards}
        dailyOffers={dailyOfferCards}
        products={featuredCards}
      />

      <div className="hidden lg:block">
        <div className="relative left-1/2 right-1/2 hidden w-screen -ml-[50vw] -mr-[50vw] bg-[var(--project-color)] lg:block">
          {/* Fills the header band with the same orange as the hero (no z-index change). */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[7.5rem] bg-[var(--project-color)]"
            aria-hidden
          />
          <HomeHero
            slides={heroSlides}
            fallbackTitle={dictionary.home.title}
            locale={locale}
            addToCartLabel={dictionary.product.addToCart}
            dailyOfferLabel={dictionary.home.dailyOffer}
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
        </div>

        <HomeCategories
          title={dictionary.home.categoriesTitle}
          emptyLabel={dictionary.home.emptyCategories}
          categories={categoryCards}
        />
      </div>
    </div>
  );
}

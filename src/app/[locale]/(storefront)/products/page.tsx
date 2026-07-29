import { notFound } from "next/navigation";

import { StorefrontMobileChrome } from "@/components/layout/StorefrontMobileChrome";
import { listStorefrontCategories } from "@/features/categories/application/list-storefront-categories";
import {
  getActiveProductsPage,
  getPrimaryCategoryLabels,
} from "@/features/products/queries";
import { resolveCategoryIconSrc } from "@/features/products/ui/shop/resolve-category-icon";
import { buildCatalogHref } from "@/features/products/ui/shop/build-catalog-href";
import { ShopCatalogPanel } from "@/features/products/ui/shop/ShopCatalogPanel";
import { ShopCategorySidebar } from "@/features/products/ui/shop/ShopCategorySidebar";
import { ShopMobileCategories } from "@/features/products/ui/shop/ShopMobileCategories";
import { ShopSmoothScroll } from "@/features/products/ui/shop/ShopSmoothScroll";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  createDisplayPriceFormatter,
  type DisplayPrice,
  getSelectedCurrency,
} from "@/lib/money/display-price";

type ProductsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    category?: string;
    min?: string;
    max?: string;
    q?: string;
    diet?: string;
  }>;
};

const CATALOG_CARD_RATING = 5;
/** PostgreSQL `integer` upper bound used for catalog price filters. */
const PRICE_FILTER_MAX = 2_147_483_647;

function formatCardPrice(price: DisplayPrice): string {
  if (price.displayCurrency === "AMD") {
    return `${price.displayAmount.toString()} Դ`;
  }
  return price.formatted;
}

function parseOptionalInt(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (!/^\d{1,10}$/.test(trimmed)) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 0 ||
    parsed > PRICE_FILTER_MAX
  ) {
    return null;
  }
  return parsed;
}

function firstPhoneHref(phones: string): string {
  const match = phones.match(/\d[\d\s()-]{5,}/);
  if (!match) {
    return "tel:+37460388080";
  }
  const digits = match[0].replace(/\D/g, "");
  return `tel:+${digits.startsWith("0") ? `374${digits.slice(1)}` : digits}`;
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { locale: rawLocale } = await params;
  const sp = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const parsedPage = Number.parseInt(sp.page ?? "1", 10);
  let page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const categoryParam = sp.category?.trim() || null;
  const selectedCategory = categoryParam || "all";
  const showMobileCategoryPicker = categoryParam == null;
  const minPrice = parseOptionalInt(sp.min);
  const maxPrice = parseOptionalInt(sp.max);
  const searchQuery = sp.q?.trim() || "";
  const diet: "none" | "veg" | "spicy" =
    sp.diet === "veg" || sp.diet === "spicy" ? sp.diet : "none";

  const dictionary = getDictionary(rawLocale);
  const catalogCopy = dictionary.catalog;

  const [initialCatalog, currency, user, categories] = await Promise.all([
    getActiveProductsPage(rawLocale, page, {
      categorySlug: selectedCategory,
      minPrice,
      maxPrice,
      query: searchQuery || null,
    }),
    getSelectedCurrency(),
    getCurrentUser(),
    listStorefrontCategories(rawLocale),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(initialCatalog.total / initialCatalog.pageSize),
  );
  const catalog =
    page > totalPages
      ? await getActiveProductsPage(rawLocale, totalPages, {
          categorySlug: selectedCategory,
          minPrice,
          maxPrice,
          query: searchQuery || null,
        })
      : initialCatalog;
  if (page > totalPages) {
    page = totalPages;
  }

  const { products } = catalog;
  const [wishlistIds, formatPrice, categoryLabels] = await Promise.all([
    getWishlistProductIds(products.map((product) => product.id)),
    createDisplayPriceFormatter(rawLocale, currency),
    getPrimaryCategoryLabels(
      products.map((product) => product.id),
      rawLocale,
    ),
  ]);

  const catalogCards = products.map((product) => {
    const price = formatPrice(product.priceAmount);
    const compareAt =
      product.compareAtAmount != null
        ? formatPrice(product.compareAtAmount)
        : null;

    return {
      id: product.id,
      href: `/${rawLocale}/products/${product.translation.slug}`,
      title: product.translation.title,
      priceFormatted: formatCardPrice(price),
      compareAtFormatted: compareAt ? formatCardPrice(compareAt) : null,
      discountPercent: product.discountPercent,
      imageUrl: product.imageUrl,
      inStock: product.stockOnHand > 0,
      inWishlist: wishlistIds.has(product.id),
      categoryLabel: categoryLabels.get(product.id) ?? null,
    };
  });

  const categoryItems = categories
    .filter((category) => category.slug)
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      title: category.title,
      imageUrl: category.imageUrl,
      iconSrc: resolveCategoryIconSrc(category.slug, category.title),
      href: buildCatalogHref(rawLocale, {
        category: category.slug,
        min: sp.min,
        max: sp.max,
        q: searchQuery || undefined,
        diet: diet === "none" ? undefined : diet,
      }),
    }));

  const allHref = buildCatalogHref(rawLocale, {
    category: "all",
    min: sp.min,
    max: sp.max,
    q: searchQuery || undefined,
    diet: diet === "none" ? undefined : diet,
  });
  const categoriesPickerHref = `/${rawLocale}/products`;
  const searchAction = `/${rawLocale}/products`;
  const allImageUrl =
    categoryItems[0]?.imageUrl ?? "/assets/categories/pizza.webp";
  const priceLabel = catalogCopy.priceLabel.replace("{currency}", currency);

  const catalogPanelProps = {
    locale: rawLocale,
    menuTitle: catalogCopy.menuTitle,
    menuSubtitle: catalogCopy.menuSubtitle,
    selectCategoriesLabel: catalogCopy.selectCategories,
    categoriesPickerHref,
    showSelectCategories: true as const,
    priceLabel,
    priceFromLabel: catalogCopy.priceFrom,
    priceToLabel: catalogCopy.priceTo,
    dietFilterLabel: catalogCopy.dietFilterLabel,
    dietNoneLabel: catalogCopy.dietNone,
    dietVegetarianLabel: catalogCopy.dietVegetarian,
    dietSpicyLabel: catalogCopy.dietSpicy,
    minPrice: sp.min ?? "",
    maxPrice: sp.max ?? "",
    diet,
    filterKey: `filters-${sp.min ?? ""}-${sp.max ?? ""}`,
    emptyTitle: catalogCopy.emptyProducts,
    emptyDescription: catalogCopy.emptyProductsDescription,
    emptySearchTitle: catalogCopy.emptySearchTitle,
    emptySearchDescription: catalogCopy.emptySearchDescription,
    emptyCtaLabel: catalogCopy.emptyProductsCta,
    emptyCtaHref: `/${rawLocale}/products?category=all`,
    loadingLabel: catalogCopy.loadingProducts,
    searchQuery,
    products: catalogCards,
    wishlistLabel: dictionary.nav.wishlist,
    addToCartLabel: dictionary.product.addToCart,
    outOfStockLabel: dictionary.product.outOfStock,
    rating: CATALOG_CARD_RATING,
    isSignedIn: Boolean(user),
    paginationLabel: catalogCopy.paginationLabel,
    previousLabel: catalogCopy.previousPage,
    nextLabel: catalogCopy.nextPage,
    currentPage: page,
    totalPages,
    paginationLocale: rawLocale,
    paginationCategory: categoryParam ?? undefined,
    paginationMin: sp.min,
    paginationMax: sp.max,
    paginationQuery: searchQuery || undefined,
    paginationDiet: diet === "none" ? undefined : diet,
  };

  return (
    <ShopSmoothScroll>
      <div
        data-shop-page
        className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white"
      >
        <StorefrontMobileChrome
          locale={rawLocale}
          currency={currency}
          brand={dictionary.brand}
          callLabel={dictionary.home.call}
          phoneHref={firstPhoneHref(dictionary.footer.phones)}
          currencyLabel={dictionary.header.currency}
          languageLabel={dictionary.header.language}
          searchLabel={dictionary.header.search}
          searchPlaceholder={dictionary.header.search}
          searchQuery={searchQuery}
        >
          {showMobileCategoryPicker ? (
            <ShopMobileCategories
              title={catalogCopy.categoriesTitle}
              allLabel={catalogCopy.allCategories}
              allHref={allHref}
              allImageUrl={allImageUrl}
              categories={categoryItems}
            />
          ) : (
            <ShopCatalogPanel {...catalogPanelProps} />
          )}
        </StorefrontMobileChrome>

        <div className="mx-auto hidden min-w-0 w-full max-w-[min(1450px,calc(100%-2rem))] gap-4 px-4 pt-2 pb-10 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:flex lg:max-w-[min(1450px,calc(100%-3rem))] lg:gap-8 lg:pt-5 xl:pl-4 2xl:px-6">
          <ShopCategorySidebar
            title={catalogCopy.categoriesSidebarTitle}
            allLabel={catalogCopy.allCategories}
            searchPlaceholder={catalogCopy.sidebarSearchPlaceholder}
            categories={categoryItems}
            selectedSlug={selectedCategory}
            allHref={allHref}
            searchAction={searchAction}
            searchQuery={searchQuery}
          />

          <ShopCatalogPanel
            {...catalogPanelProps}
            showSelectCategories={false}
          />
        </div>
      </div>
    </ShopSmoothScroll>
  );
}

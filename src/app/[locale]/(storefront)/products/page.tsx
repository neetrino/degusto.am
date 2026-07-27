import { Suspense } from "react";
import { notFound } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { listStorefrontCategories } from "@/features/categories/application/list-storefront-categories";
import {
  getActiveProductsPage,
  getPrimaryCategoryLabels,
} from "@/features/products/queries";
import { CatalogProductCard } from "@/features/products/ui/shop/CatalogProductCard";
import { resolveCategoryIconSrc } from "@/features/products/ui/shop/resolve-category-icon";
import { ShopCatalogFilters } from "@/features/products/ui/shop/ShopCatalogFilters";
import { ShopCategorySidebar } from "@/features/products/ui/shop/ShopCategorySidebar";
import { isComboSlug } from "@/features/products/ui/shop/combo-slug";
import { ShopMobileCategories } from "@/features/products/ui/shop/ShopMobileCategories";
import { ShopEmptyState } from "@/features/products/ui/shop/ShopEmptyState";
import { ShopPagination } from "@/features/products/ui/shop/ShopPagination";
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
  // Reject scientific notation / oversized digit strings before JS loses precision.
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

function buildCatalogHref(
  locale: string,
  input: {
    category?: string;
    page?: number;
    min?: string;
    max?: string;
    q?: string;
    diet?: string;
  },
): string {
  if (input.category && isComboSlug(input.category)) {
    const params = new URLSearchParams();
    if (input.page && input.page > 1) params.set("page", String(input.page));
    if (input.min) params.set("min", input.min);
    if (input.max) params.set("max", input.max);
    if (input.q) params.set("q", input.q);
    if (input.diet && input.diet !== "none") params.set("diet", input.diet);
    const query = params.toString();
    return query ? `/${locale}/combo?${query}` : `/${locale}/combo`;
  }

  const params = new URLSearchParams();
  if (input.category && input.category !== "all") {
    params.set("category", input.category);
  } else if (input.category === "all") {
    params.set("category", "all");
  }
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.min) params.set("min", input.min);
  if (input.max) params.set("max", input.max);
  if (input.q) params.set("q", input.q);
  if (input.diet && input.diet !== "none") params.set("diet", input.diet);
  const query = params.toString();
  return query ? `/${locale}/products?${query}` : `/${locale}/products`;
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
  const diet =
    sp.diet === "veg" || sp.diet === "spicy" ? sp.diet : ("none" as const);

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

  const priced = products.map((product) => {
    const price = formatPrice(product.priceAmount);
    const compareAt =
      product.compareAtAmount != null
        ? formatPrice(product.compareAtAmount)
        : null;

    return {
      product,
      priceFormatted: formatCardPrice(price),
      compareAtFormatted: compareAt ? formatCardPrice(compareAt) : null,
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

  const filtersFallback = (
    <div className="flex h-[83px] flex-wrap items-center gap-2 xl:pt-[37px]" />
  );

  return (
    <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white">
      <div className="mx-auto flex min-w-0 w-full max-w-[min(1450px,calc(100%-2rem))] gap-4 px-4 pt-2 pb-10 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))] lg:gap-8 lg:pt-5 xl:pl-4 2xl:px-6">
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

        <div className="min-w-0 flex-1">
          {showMobileCategoryPicker ? (
            <ShopMobileCategories
              title={catalogCopy.categoriesTitle}
              allLabel={catalogCopy.allCategories}
              allHref={allHref}
              allImageUrl={allImageUrl}
              categories={categoryItems}
            />
          ) : null}

          <section
            className={`min-w-0 flex-1 ${showMobileCategoryPicker ? "hidden lg:block" : "block"}`}
          >
            <div className="mb-[42px] mt-2 flex flex-col gap-6 xl:mt-0 xl:flex-row xl:items-start xl:justify-between lg:mt-0">
              <div className="min-w-0 max-w-xl">
                <h1 className="text-4xl leading-tight font-bold text-brand-headline xl:text-[60px] xl:leading-[51px]">
                  {catalogCopy.menuTitle}
                </h1>
                <p className="mt-3 text-base text-[#717182]">
                  {catalogCopy.menuSubtitle}
                </p>
                <AppLink
                  href={categoriesPickerHref}
                  prefetchPolicy="intent"
                  className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#ff7f20] px-6 text-base font-semibold text-white lg:hidden"
                >
                  {catalogCopy.selectCategories}
                </AppLink>
              </div>

              <Suspense fallback={filtersFallback}>
                <ShopCatalogFilters
                  key={`filters-${sp.min ?? ""}-${sp.max ?? ""}`}
                  priceLabel={priceLabel}
                  priceFromLabel={catalogCopy.priceFrom}
                  priceToLabel={catalogCopy.priceTo}
                  dietFilterLabel={catalogCopy.dietFilterLabel}
                  dietNoneLabel={catalogCopy.dietNone}
                  dietVegetarianLabel={catalogCopy.dietVegetarian}
                  dietSpicyLabel={catalogCopy.dietSpicy}
                  minPrice={sp.min ?? ""}
                  maxPrice={sp.max ?? ""}
                  diet={diet}
                />
              </Suspense>
            </div>

            {priced.length === 0 ? (
              <ShopEmptyState
                title={catalogCopy.emptyProducts}
                description={catalogCopy.emptyProductsDescription}
                ctaLabel={catalogCopy.emptyProductsCta}
                ctaHref={`/${rawLocale}/products?category=all`}
              />
            ) : (
              <div className="grid min-w-0 grid-cols-2 gap-4 xl:grid-cols-3 xl:gap-[30px]">
                {priced.map(
                  (
                    { product, priceFormatted, compareAtFormatted, categoryLabel },
                    index,
                  ) => (
                    <CatalogProductCard
                      key={product.id}
                      href={`/${rawLocale}/products/${product.translation.slug}`}
                      title={product.translation.title}
                      priceFormatted={priceFormatted}
                      compareAtFormatted={compareAtFormatted}
                      discountPercent={product.discountPercent}
                      imageUrl={product.imageUrl}
                      inStock={product.stockOnHand > 0}
                      priority={index < 6}
                      locale={rawLocale}
                      productId={product.id}
                      inWishlist={wishlistIds.has(product.id)}
                      isSignedIn={Boolean(user)}
                      wishlistLabel={dictionary.nav.wishlist}
                      addToCartLabel={dictionary.product.addToCart}
                      outOfStockLabel={dictionary.product.outOfStock}
                      categoryLabel={categoryLabel}
                      rating={CATALOG_CARD_RATING}
                      isSpicy
                      isVegetarian
                    />
                  ),
                )}
              </div>
            )}

            <ShopPagination
              ariaLabel={catalogCopy.paginationLabel}
              previousLabel={catalogCopy.previousPage}
              nextLabel={catalogCopy.nextPage}
              currentPage={page}
              totalPages={totalPages}
              buildHref={(nextPage) =>
                buildCatalogHref(rawLocale, {
                  category: categoryParam ?? undefined,
                  page: nextPage,
                  min: sp.min,
                  max: sp.max,
                  q: searchQuery || undefined,
                  diet: diet === "none" ? undefined : diet,
                })
              }
            />
          </section>
        </div>
      </div>
    </div>
  );
}

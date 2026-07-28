import { HomeMobileProductCard } from "@/features/home/ui/HomeMobileProductCard";
import { CatalogProductCard } from "@/features/products/ui/shop/CatalogProductCard";
import { WishlistEmptyState } from "@/features/wishlist/ui/WishlistEmptyState";
import type { Locale } from "@/lib/i18n/config";

type WishlistCard = {
  id: string;
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted: string | null;
  discountPercent: number | null;
  imageUrl: string | null;
  inStock: boolean;
  categoryLabel: string | null;
};

type WishlistPanelProps = {
  locale: Locale;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  loginLabel?: string;
  loginHref?: string;
  viewProductsLabel: string;
  viewProductsHref: string;
  products: readonly WishlistCard[];
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  isSignedIn: boolean;
  rating: number;
};

/**
 * Wishlist title + empty state or product grids (mobile compact / desktop catalog).
 */
export function WishlistPanel({
  locale,
  title,
  emptyTitle,
  emptyDescription,
  loginLabel,
  loginHref,
  viewProductsLabel,
  viewProductsHref,
  products,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  isSignedIn,
  rating,
}: WishlistPanelProps) {
  return (
    <section className="min-w-0 flex-1">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      {products.length === 0 ? (
        <WishlistEmptyState
          title={emptyTitle}
          description={emptyDescription}
          loginLabel={loginLabel}
          loginHref={loginHref}
          viewProductsLabel={viewProductsLabel}
          viewProductsHref={viewProductsHref}
        />
      ) : (
        <>
          <div className="mt-4 grid min-w-0 grid-cols-2 gap-x-[14px] gap-y-[30px] lg:hidden">
            {products.map((product, index) => (
              <HomeMobileProductCard
                key={product.id}
                href={product.href}
                title={product.title}
                priceFormatted={product.priceFormatted}
                compareAtFormatted={product.compareAtFormatted}
                discountPercent={product.discountPercent}
                imageUrl={product.imageUrl}
                inStock={product.inStock}
                priority={index < 4}
                locale={locale}
                productId={product.id}
                inWishlist
                isSignedIn={isSignedIn}
                wishlistLabel={wishlistLabel}
                addToCartLabel={addToCartLabel}
                outOfStockLabel={outOfStockLabel}
                categoryLabel={product.categoryLabel}
                rating={rating}
              />
            ))}
          </div>

          <div className="hidden min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid xl:grid-cols-4 xl:gap-[30px]">
            {products.map((product, index) => (
              <CatalogProductCard
                key={product.id}
                href={product.href}
                title={product.title}
                priceFormatted={product.priceFormatted}
                compareAtFormatted={product.compareAtFormatted}
                discountPercent={product.discountPercent}
                imageUrl={product.imageUrl}
                inStock={product.inStock}
                priority={index < 6}
                locale={locale}
                productId={product.id}
                inWishlist
                isSignedIn={isSignedIn}
                wishlistLabel={wishlistLabel}
                addToCartLabel={addToCartLabel}
                outOfStockLabel={outOfStockLabel}
                categoryLabel={product.categoryLabel}
                rating={rating}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

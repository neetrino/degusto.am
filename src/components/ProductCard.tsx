'use client';

import { useState, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth/AuthContext';
import { useWishlist } from './hooks/useWishlist';
import { useCompare } from './hooks/useCompare';
import { useAddToCart } from './hooks/useAddToCart';
import { useCurrency } from './hooks/useCurrency';
import { ProductCardList } from './ProductCard/ProductCardList';
import { ProductCardGrid } from './ProductCard/ProductCardGrid';
import { prefetchProductRoute } from '../lib/products/prefetch-product-route';
import { resolveStorefrontProductImage } from '@/constants/storefront-product-image';
import { setProductSummarySnapshot } from '@/lib/products/product-summary-cache';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
  inStock: boolean;
  defaultVariantId?: string | null;
  labels?: import('./ProductLabels').ProductLabel[];
  compareAtPrice?: number | null;
  originalPrice?: number | null;
  globalDiscount?: number | null;
  discountPercent?: number | null;
  colors?: Array<{ value: string; imageUrl?: string | null; colors?: string[] | null }>;
}

type ViewMode = 'list' | 'grid-2' | 'grid-3';

interface ProductCardProps {
  product: Product;
  viewMode?: ViewMode;
}

/**
 * Product card component with Compare, Wishlist and Cart icons
 * Displays product image, title, category, price and action buttons
 */
export function ProductCard({ product, viewMode = 'grid-3' }: ProductCardProps) {
  const isCompact = viewMode === 'grid-3';
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const currency = useCurrency();
  const { isInWishlist, toggleWishlist } = useWishlist(product.id);
  const { isInCompare, toggleCompare } = useCompare(product.id);
  const { isAddingToCart, isUpdatingQuantity, quantity, addToCart, removeFromCart } = useAddToCart({
    productId: product.id,
    productSlug: product.slug,
    inStock: product.inStock,
    defaultVariantId: product.defaultVariantId ?? undefined,
    price: product.price,
    title: product.title,
    image: product.image,
  });
  const [imageError, setImageError] = useState(false);

  // Handle wishlist toggle with auth check
  const handleWishlistToggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      router.push(`/login?redirect=/products`);
      return;
    }
    
    toggleWishlist();
  };

  // Handle compare toggle
  const handleCompareToggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare();
  };

  // Handle add to cart
  const handleAddToCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const button = e.currentTarget as HTMLElement;
    const card = button.closest('[data-product-card]');
    const origin =
      (card?.querySelector('[data-product-fly-origin]') as HTMLElement | null) ?? button;
    addToCart({ origin, imageUrl: resolveStorefrontProductImage(product.image) });
  };

  const handleDecreaseCart = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void removeFromCart();
  };

  const productHref = `/products/${product.slug}`;

  const handlePrefetchNavigate = useCallback(() => {
    setProductSummarySnapshot({
      id: product.id,
      slug: product.slug,
      title: product.title,
      image: resolveStorefrontProductImage(product.image),
      price: product.price,
      oldPrice: product.originalPrice ?? product.compareAtPrice ?? null,
      discount: product.discountPercent ?? product.globalDiscount ?? null,
      category: null,
      brand: null,
      currency: 'USD',
      labels: product.labels ?? [],
      inStock: product.inStock,
      defaultVariantId: product.defaultVariantId ?? null,
    });
    prefetchProductRoute(router, product.slug);
  }, [router, product]);

  // List view layout
  if (viewMode === 'list') {
    return (
      <ProductCardList
        product={product}
        currency={currency}
        isInWishlist={isInWishlist}
        isInCompare={isInCompare}
        isAddingToCart={isAddingToCart}
        isUpdatingQuantity={isUpdatingQuantity}
        cartQuantity={quantity}
        imageError={imageError}
        onImageError={() => setImageError(true)}
        onWishlistToggle={handleWishlistToggle}
        onCompareToggle={handleCompareToggle}
        onAddToCart={handleAddToCart}
        onDecreaseCart={handleDecreaseCart}
        productHref={productHref}
        onPrefetchNavigate={handlePrefetchNavigate}
      />
    );
  }

  // Grid view layout
  return (
    <ProductCardGrid
      product={product}
      currency={currency}
      isInWishlist={isInWishlist}
      isInCompare={isInCompare}
      isAddingToCart={isAddingToCart}
      isUpdatingQuantity={isUpdatingQuantity}
      cartQuantity={quantity}
      imageError={imageError}
      isCompact={isCompact}
      onImageError={() => setImageError(true)}
      onWishlistToggle={handleWishlistToggle}
      onCompareToggle={handleCompareToggle}
      onAddToCart={handleAddToCart}
      onDecreaseCart={handleDecreaseCart}
      productHref={productHref}
      onPrefetchNavigate={handlePrefetchNavigate}
    />
  );
}


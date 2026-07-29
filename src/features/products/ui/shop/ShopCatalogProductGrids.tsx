"use client";

import { motion, useReducedMotion } from "motion/react";

import { HomeMobileProductCard } from "@/features/home/ui/HomeMobileProductCard";
import { CatalogProductCard } from "@/features/products/ui/shop/CatalogProductCard";
import {
  ShopProductCardShell,
  shopGridVariants,
} from "@/features/products/ui/shop/ShopProductGridMotion";
import type { Locale } from "@/lib/i18n/config";

type CatalogCard = {
  id: string;
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted: string | null;
  discountPercent: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist: boolean;
  categoryLabel: string | null;
  isSpicy?: boolean;
  isVegetarian?: boolean;
};

type ShopCatalogProductGridsProps = {
  locale: Locale;
  products: readonly CatalogCard[];
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  rating: number;
  isSignedIn: boolean;
};

/** Animated mobile + desktop product grids for the shop catalog. */
export function ShopCatalogProductGrids({
  locale,
  products,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  rating,
  isSignedIn,
}: ShopCatalogProductGridsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <motion.div
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={reduceMotion ? undefined : shopGridVariants}
        className="mt-8 grid min-w-0 grid-cols-2 gap-x-[14px] gap-y-[52px] lg:hidden"
      >
        {products.map((product, index) => (
          <ShopProductCardShell
            key={product.id}
            index={index}
            reduceMotion={reduceMotion}
          >
            <HomeMobileProductCard
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
              inWishlist={product.inWishlist}
              isSignedIn={isSignedIn}
              wishlistLabel={wishlistLabel}
              addToCartLabel={addToCartLabel}
              outOfStockLabel={outOfStockLabel}
              categoryLabel={product.categoryLabel}
              rating={rating}
              isSpicy={product.isSpicy ?? true}
              isVegetarian={product.isVegetarian ?? true}
            />
          </ShopProductCardShell>
        ))}
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={reduceMotion ? undefined : shopGridVariants}
        className="hidden min-w-0 grid-cols-2 gap-x-4 gap-y-12 lg:grid xl:grid-cols-3 xl:gap-x-[30px] xl:gap-y-14"
      >
        {products.map((product, index) => (
          <ShopProductCardShell
            key={product.id}
            index={index}
            reduceMotion={reduceMotion}
          >
            <CatalogProductCard
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
              inWishlist={product.inWishlist}
              isSignedIn={isSignedIn}
              wishlistLabel={wishlistLabel}
              addToCartLabel={addToCartLabel}
              outOfStockLabel={outOfStockLabel}
              categoryLabel={product.categoryLabel}
              rating={rating}
              isSpicy={product.isSpicy ?? true}
              isVegetarian={product.isVegetarian ?? true}
            />
          </ShopProductCardShell>
        ))}
      </motion.div>
    </>
  );
}

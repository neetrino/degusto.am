"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

import { ProductAnimatedPrice } from "@/features/products/ui/ProductAnimatedPrice";
import { ProductGallery } from "@/features/products/ui/ProductGallery";
import { ProductModifierPills } from "@/features/products/ui/ProductModifierPills";
import {
  PRODUCT_EASE,
  productInfoItem,
  productInfoStagger,
} from "@/features/products/ui/ProductDetailMotion";
import { ProductPurchaseControls } from "@/features/products/ui/ProductPurchaseControls";
import type { ProductDetail } from "@/features/products/types";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { Locale } from "@/lib/i18n/config";
import { staticAssetUrl } from "@/lib/media/static-asset-url";

const STAR_ICON = staticAssetUrl("/assets/product-card/star.webp");

type ProductDetailMainProps = {
  locale: Locale;
  product: ProductDetail;
  priceFormatted: string;
  compareAtFormatted: string | null;
  isSignedIn: boolean;
  inWishlist: boolean;
  dictionary: Dictionary;
  ratingAverage: number;
  padded: boolean;
};

function isAmdPriceLabel(priceFormatted: string): boolean {
  return priceFormatted.includes("Դ") || /\bAMD\b/.test(priceFormatted);
}

/** Animated PDP hero — gallery + info with render stagger and scroll float. */
export function ProductDetailMain({
  locale,
  product,
  priceFormatted,
  compareAtFormatted,
  isSignedIn,
  inWishlist,
  dictionary,
  ratingAverage,
  padded,
}: ProductDetailMainProps) {
  const labels = dictionary.product;
  const inStock = product.stockOnHand > 0;
  const categoryTitle = product.categories[0]?.title ?? null;
  const description = product.translation.description?.trim() ?? "";
  const showDescription =
    description.length > 0 &&
    description !== product.translation.title.trim();
  const maxQty = Math.max(product.stockOnHand, 0);
  const [quantity, setQuantity] = useState(maxQty > 0 ? 1 : 0);
  const [selectedAddIds, setSelectedAddIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const additionsTotal = product.additions.reduce((sum, item) => {
    if (!selectedAddIds.has(item.id)) return sum;
    return sum + Math.max(0, item.priceAmount);
  }, 0);
  const liveUnitAmount = product.priceAmount + additionsTotal;
  const liveTotalAmount = liveUnitAmount * Math.max(quantity, 1);
  const animateLivePrice = isAmdPriceLabel(priceFormatted);

  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
    mass: 0.45,
  });
  const galleryY = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [36, 0, -28],
  );
  const infoY = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [22, 0, -18],
  );

  const shellClass = padded
    ? "mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 pb-10 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))] lg:pb-14"
    : "w-full pb-6";

  return (
    <div className={shellClass}>
      <section
        ref={sectionRef}
        className="w-full overflow-hidden bg-white lg:rounded-[40px]"
      >
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch lg:gap-[47px] xl:grid-cols-[minmax(0,47.5625rem)_minmax(0,1fr)]">
          <motion.div
            style={{ y: galleryY }}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, x: -56, scale: 0.94, filter: "blur(14px)" }
            }
            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.05, ease: PRODUCT_EASE }}
            className="will-change-transform"
          >
            <ProductGallery
              images={product.images}
              title={product.translation.title}
              discountPercent={product.discountPercent}
              inStock={inStock}
              outOfStockLabel={labels.outOfStock}
              expandLabel={labels.expandImage}
              closeLabel={labels.closeImage}
            />
          </motion.div>

          <motion.div
            style={{ y: infoY }}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            variants={reduceMotion ? undefined : productInfoStagger}
            className="flex min-w-0 flex-col will-change-transform lg:min-h-full lg:py-2"
          >
            <motion.h1
              variants={reduceMotion ? undefined : productInfoItem}
              className="mb-2 break-words text-[2.25rem] leading-normal font-bold text-[#3C2F2F]"
            >
              {product.translation.title}
            </motion.h1>

            <motion.div
              variants={reduceMotion ? undefined : productInfoItem}
              className="mb-5 flex items-center gap-[3px] lg:gap-[5px]"
              aria-label={`Rating ${ratingAverage.toFixed(1)}`}
            >
              {Array.from({ length: 5 }, (_, index) => (
                <motion.span
                  key={index}
                  initial={
                    reduceMotion ? false : { opacity: 0, scale: 0.5, rotate: -20 }
                  }
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 14,
                    delay: 0.35 + index * 0.06,
                  }}
                  className="inline-flex"
                >
                  <Image
                    src={STAR_ICON}
                    alt=""
                    width={28}
                    height={28}
                    className={`size-5 object-contain lg:size-7 ${
                      index < Math.round(ratingAverage)
                        ? "opacity-100"
                        : "opacity-35 grayscale"
                    }`}
                    aria-hidden
                  />
                </motion.span>
              ))}
            </motion.div>

            <motion.div
              variants={reduceMotion ? undefined : productInfoItem}
              className="mb-4 flex flex-wrap items-baseline gap-x-3"
            >
              {animateLivePrice ? (
                <ProductAnimatedPrice
                  amount={liveTotalAmount}
                  suffix=" Դ"
                  className="text-[2.25rem] leading-none font-bold tabular-nums text-[#3C2F2F]"
                />
              ) : (
                <p className="text-[2.25rem] leading-none font-bold text-[#3C2F2F]">
                  {priceFormatted}
                </p>
              )}
              {compareAtFormatted ? (
                <p className="text-base text-[#9a9a9a] line-through md:text-lg">
                  {compareAtFormatted}
                </p>
              ) : null}
            </motion.div>

            {categoryTitle ? (
              <motion.p
                variants={reduceMotion ? undefined : productInfoItem}
                className="mb-5 max-w-[31.125rem] text-base leading-6 font-normal text-[#3C2F2F]"
              >
                {categoryTitle} — {product.translation.title}
              </motion.p>
            ) : null}

            {showDescription ? (
              <motion.p
                variants={reduceMotion ? undefined : productInfoItem}
                className="mb-5 max-w-[31.125rem] whitespace-pre-wrap text-base leading-6 text-[#3C2F2F]"
              >
                {description}
              </motion.p>
            ) : null}

            <motion.div variants={reduceMotion ? undefined : productInfoItem}>
              <ProductModifierPills
                addLabel={labels.addModifier}
                excludeLabel={labels.excludeModifier}
                excludeHint={labels.excludeModifierHint}
                emptyAddLabel={labels.noModifierOptions}
                emptyExcludeLabel={labels.noExcludeOptions}
                addOptions={product.additions.map((item) => ({
                  id: item.id,
                  label: item.label,
                  priceAmount: item.priceAmount,
                  priceLabel:
                    item.priceAmount > 0 ? `+${item.priceAmount} Դ` : undefined,
                }))}
                excludeOptions={product.exclusions}
                onSelectedAddChange={setSelectedAddIds}
              />
            </motion.div>

            <motion.div variants={reduceMotion ? undefined : productInfoItem}>
              <ProductPurchaseControls
                locale={locale}
                productId={product.id}
                stockOnHand={product.stockOnHand}
                quantity={quantity}
                onQuantityChange={setQuantity}
                inWishlist={inWishlist}
                isSignedIn={isSignedIn}
                wishlistLabel={dictionary.nav.wishlist}
                labels={{
                  quantity: labels.quantity,
                  decreaseQuantity: dictionary.cartDrawer.decreaseQuantity,
                  increaseQuantity: dictionary.cartDrawer.increaseQuantity,
                  addToCart: labels.addToCart,
                  adding: labels.adding,
                  outOfStock: labels.outOfStock,
                  added: labels.added,
                  error: labels.addError,
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

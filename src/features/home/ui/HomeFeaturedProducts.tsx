"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";
import { useRef, type ReactNode } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { ProductCard } from "@/features/products/ui/ProductCard";
import type { Locale } from "@/lib/i18n/config";

type FeaturedItem = {
  id: string;
  href: string;
  title: string;
  priceFormatted: string;
  compareAtFormatted?: string | null;
  discountPercent?: number | null;
  imageUrl: string | null;
  inStock: boolean;
  inWishlist?: boolean;
  categoryLabel?: string | null;
  rating?: number | null;
  isSpicy?: boolean;
  isVegetarian?: boolean;
};

type HomeFeaturedProductsProps = {
  locale: Locale;
  titleLead: string;
  titleAccent: string;
  viewAllLabel: string;
  viewAllHref: string;
  emptyLabel: string;
  wishlistLabel: string;
  addToCartLabel: string;
  outOfStockLabel: string;
  isSignedIn: boolean;
  products: readonly FeaturedItem[];
};

const EASE = [0.22, 1, 0.36, 1] as const;

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const cardEnterVariants: Variants = {
  hidden: { opacity: 0, y: 56, scale: 0.9, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 16 },
  },
};

type FeaturedCardShellProps = {
  children: ReactNode;
  index: number;
  progress: MotionValue<number>;
  reduceMotion: boolean | null;
};

function FeaturedCardShell({
  children,
  index,
  progress,
  reduceMotion,
}: FeaturedCardShellProps) {
  const direction = index % 2 === 0 ? 1 : -1;
  const y = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [28 * direction, 0, -32 * direction],
  );

  return (
    <motion.div variants={reduceMotion ? undefined : cardEnterVariants}>
      <motion.div style={{ y }} className="w-[236px] shrink-0 will-change-transform">
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Desktop featured strip — entrance once + continuous scroll motion. */
export function HomeFeaturedProducts({
  locale,
  titleLead,
  titleAccent,
  viewAllLabel,
  viewAllHref,
  emptyLabel,
  wishlistLabel,
  addToCartLabel,
  outOfStockLabel,
  isSignedIn,
  products,
}: HomeFeaturedProductsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 28,
    mass: 0.45,
  });

  const watermarkY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["18%", "-18%"],
  );
  const headerY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["6%", "-8%"],
  );

  return (
    <section
      ref={sectionRef}
      className="relative left-1/2 right-1/2 isolate z-30 hidden min-h-[520px] w-screen -mt-10 -ml-[50vw] -mr-[50vw] overflow-hidden rounded-t-[40px] bg-surface-ink pt-6 pb-14 lg:block lg:min-h-[640px] xl:min-h-[700px]"
    >
      <motion.p
        aria-hidden
        style={{ y: watermarkY }}
        className="pointer-events-none absolute top-8 right-6 select-none font-display text-[7rem] leading-none font-black tracking-tighter text-white/[0.04] uppercase md:text-[10rem] lg:text-[12rem]"
      >
        New
      </motion.p>

      <div className="mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
        <motion.div
          style={{ y: headerY }}
          className="relative z-40 flex flex-col gap-6 pt-[70px] sm:flex-row sm:items-end sm:justify-between"
        >
          <motion.h2
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 40, filter: "blur(12px)" }
            }
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="relative z-40 font-display text-4xl font-black text-white md:text-6xl"
          >
            <span className="text-brand-headline">{titleLead} </span>
            {titleAccent}
          </motion.h2>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
          >
            <AppLink
              href={viewAllHref}
              prefetchPolicy="intent"
              className="group relative z-40 inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand px-6 py-4 text-lg font-bold text-white transition-[background-color] duration-[550ms] hover:bg-[#2a2a2a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 origin-left scale-x-0 rounded-full bg-[#2a2a2a] transition-transform duration-[550ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-x-100 motion-reduce:transition-none motion-reduce:group-hover:scale-x-100"
              />
              <span className="relative z-10 transition-colors duration-300 group-hover:text-brand">
                {viewAllLabel} →
              </span>
            </AppLink>
          </motion.div>
        </motion.div>

        {products.length === 0 ? (
          <p className="mt-10 text-white/70">{emptyLabel}</p>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={reduceMotion ? undefined : listVariants}
            className="mt-20 overflow-x-auto pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="mx-auto flex w-max max-w-full flex-nowrap justify-start gap-2.5 xl:justify-center">
              {products.map((product, index) => (
                <FeaturedCardShell
                  key={product.id}
                  index={index}
                  progress={progress}
                  reduceMotion={reduceMotion}
                >
                  <ProductCard
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
                    inWishlist={product.inWishlist ?? false}
                    isSignedIn={isSignedIn}
                    wishlistLabel={wishlistLabel}
                    addToCartLabel={addToCartLabel}
                    outOfStockLabel={outOfStockLabel}
                    categoryLabel={product.categoryLabel}
                    rating={product.rating}
                    isSpicy={product.isSpicy}
                    isVegetarian={product.isVegetarian}
                    showWishlist
                  />
                </FeaturedCardShell>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

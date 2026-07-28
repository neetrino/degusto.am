"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { AppLink } from "@/components/ui/AppLink";
import type { ShopCategoryItem } from "@/features/products/ui/shop/ShopCategorySidebar";

type ShopMobileCategoriesProps = {
  title: string;
  allLabel: string;
  allHref: string;
  allImageUrl: string;
  categories: readonly ShopCategoryItem[];
};

const EASE = [0.22, 1, 0.36, 1] as const;

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 36,
    scale: 0.92,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 110, damping: 16 },
  },
};

/** Mobile-only category card grid — staggered Motion entrance. */
export function ShopMobileCategories({
  title,
  allLabel,
  allHref,
  allImageUrl,
  categories,
}: ShopMobileCategoriesProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section>
      <motion.h1
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE }}
        className="text-base leading-5 font-semibold text-black"
      >
        {title}
      </motion.h1>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={reduceMotion ? undefined : gridVariants}
        className="mt-4 grid grid-cols-2 gap-x-3 gap-y-[14px]"
      >
        <motion.div variants={reduceMotion ? undefined : cardVariants}>
          <CategoryCard href={allHref} title={allLabel} imageUrl={allImageUrl} />
        </motion.div>
        {categories.map((category) => (
          <motion.div
            key={category.id}
            variants={reduceMotion ? undefined : cardVariants}
          >
            <CategoryCard
              href={category.href}
              title={category.title}
              imageUrl={category.imageUrl}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function CategoryCard({
  href,
  title,
  imageUrl,
}: {
  href: string;
  title: string;
  imageUrl: string;
}) {
  return (
    <AppLink
      href={href}
      prefetchPolicy="intent"
      className="relative block h-[183px] overflow-hidden rounded-[28px] bg-[#090909] text-left transition-opacity active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-headline"
    >
      <p className="relative z-10 px-[13px] pt-5 text-xs leading-[18px] font-medium text-white">
        {title}
      </p>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[134px] overflow-hidden rounded-b-[28px]">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 1024px) 50vw, 240px"
          className="object-cover object-center"
          aria-hidden
        />
      </div>
    </AppLink>
  );
}

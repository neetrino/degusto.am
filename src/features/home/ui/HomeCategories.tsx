"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";

type CategoryItem = {
  id: string;
  href: string;
  title: string;
  productCountLabel: string;
  imageUrl: string;
};

type HomeCategoriesProps = {
  title: string;
  emptyLabel: string;
  categories: readonly CategoryItem[];
};

const EASE = [0.22, 1, 0.36, 1] as const;

const SPRING_LIFT = {
  type: "spring" as const,
  stiffness: 280,
  damping: 20,
  mass: 0.65,
};

const SPRING_IMAGE = {
  type: "spring" as const,
  stiffness: 240,
  damping: 16,
  mass: 0.55,
};

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
};

const cardEnterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 56,
    scale: 0.94,
    filter: "blur(14px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 90, damping: 15 },
  },
};

/** Hover orchestration — no mouse tracking, no borders/gradients/shadows. */
const cardHoverVariants: Variants = {
  rest: {
    y: 0,
    zIndex: 1,
    backgroundColor: "#121212",
  },
  hover: {
    y: -16,
    zIndex: 8,
    backgroundColor: "#ffffff",
    transition: SPRING_LIFT,
  },
};

const accentVariants: Variants = {
  rest: { scaleX: 0, opacity: 0 },
  hover: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.42, ease: EASE, delay: 0.04 },
  },
};

const metaVariants: Variants = {
  rest: { opacity: 0.8, y: 0, color: "rgba(255,255,255,0.8)" },
  hover: {
    opacity: 1,
    y: -3,
    color: "#717182",
    transition: { duration: 0.32, ease: EASE },
  },
};

const imageVariants: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.18,
    y: -12,
    transition: SPRING_IMAGE,
  },
};

const titleVariants: Variants = {
  rest: { y: 0, color: "#ffffff" },
  hover: {
    y: -2,
    color: "#ff7f20",
    transition: { duration: 0.28, ease: EASE },
  },
};

/** Desktop categories — Motion master entrance + hover (no mouse drag, no gradients). */
export function HomeCategories({
  title,
  emptyLabel,
  categories,
}: HomeCategoriesProps) {
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

  const titleY = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["8%", "-6%"],
  );
  const watermarkX = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["4%", "-6%"],
  );

  return (
    <div className="relative left-1/2 right-1/2 hidden w-screen -ml-[50vw] -mr-[50vw] bg-black lg:block">
      <section
        ref={sectionRef}
        className="relative overflow-hidden rounded-t-[40px] bg-surface-muted pt-10 pb-20 md:pb-24"
      >
        <motion.p
          aria-hidden
          style={{ x: watermarkX }}
          className="pointer-events-none absolute top-6 right-4 select-none font-display text-[6rem] leading-none font-black tracking-tighter text-black/[0.04] uppercase md:text-[9rem] lg:text-[11rem]"
        >
          Menu
        </motion.p>

        <div className="relative mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
          <motion.h2
            style={{ y: titleY }}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 44, filter: "blur(12px)" }
            }
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="mb-8 font-sans text-5xl font-black tracking-tight text-black md:text-6xl"
          >
            {title}
          </motion.h2>

          {categories.length === 0 ? (
            <p className="text-gray-600">{emptyLabel}</p>
          ) : (
            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.12 }}
              variants={reduceMotion ? undefined : gridVariants}
              className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  reduceMotion={reduceMotion}
                />
              ))}
            </motion.ul>
          )}
        </div>
      </section>
    </div>
  );
}

type CategoryCardProps = {
  category: CategoryItem;
  reduceMotion: boolean | null;
};

function CategoryCard({ category, reduceMotion }: CategoryCardProps) {
  return (
    <motion.li
      variants={reduceMotion ? undefined : cardEnterVariants}
      className="relative h-full min-w-0"
    >
      <motion.div
        className="h-full rounded-[22px] bg-[#121212] will-change-transform hover:bg-white"
        initial="rest"
        animate="rest"
        whileHover={reduceMotion ? undefined : "hover"}
        variants={reduceMotion ? undefined : cardHoverVariants}
      >
        <AppLink
          href={category.href}
          prefetchPolicy="intent"
          aria-label={category.title}
          className="group relative flex h-full min-h-[22.6875rem] w-full min-w-0 flex-col overflow-visible rounded-[22px] p-4 outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-headline"
        >
          <div className="relative z-10 min-w-0 w-full shrink-0 overflow-hidden">
            <motion.h3
              variants={reduceMotion ? undefined : titleVariants}
              className="line-clamp-2 break-words font-sans text-[clamp(1rem,0.85rem+0.55vw,1.5rem)] leading-tight font-black text-white"
              title={category.title}
            >
              {category.title}
            </motion.h3>
            <motion.span
              aria-hidden
              variants={reduceMotion ? undefined : accentVariants}
              className="mt-2 block h-0.5 w-14 origin-left rounded-full bg-[#ff7f20] group-hover:opacity-100"
            />
            <motion.p
              variants={reduceMotion ? undefined : metaVariants}
              className="mt-2 truncate text-sm text-white/80 group-hover:text-[#717182]"
            >
              {category.productCountLabel}
            </motion.p>
          </div>

          <div className="relative z-50 mt-auto min-h-0 w-full min-w-0 flex-1 overflow-visible">
            <motion.div
              variants={reduceMotion ? undefined : imageVariants}
              className="absolute inset-0 z-50 origin-bottom will-change-transform"
            >
              <Image
                src={category.imageUrl}
                alt={category.title}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-contain object-bottom"
              />
            </motion.div>
          </div>
        </AppLink>
      </motion.div>
    </motion.li>
  );
}

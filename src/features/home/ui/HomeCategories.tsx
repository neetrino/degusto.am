"use client";

import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
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

const gridVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.12 },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 64,
    scale: 0.88,
    rotateX: 14,
    filter: "blur(12px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 95, damping: 16 },
  },
};

/** Desktop categories grid — entrance once + continuous scroll float. */
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
    reduceMotion ? ["0%", "0%"] : ["10%", "-8%"],
  );
  const watermarkX = useTransform(
    progress,
    [0, 1],
    reduceMotion ? ["0%", "0%"] : ["6%", "-8%"],
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
            className="mb-8 font-display text-5xl font-black tracking-tight text-black md:text-6xl"
          >
            {title}
          </motion.h2>

          {categories.length === 0 ? (
            <p className="text-gray-600">{emptyLabel}</p>
          ) : (
            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={reduceMotion ? undefined : gridVariants}
              className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-4"
              style={{ perspective: 1100 }}
            >
              {categories.map((category, index) => {
                const direction = index % 2 === 0 ? 1 : -1;
                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    direction={direction}
                    progress={progress}
                    reduceMotion={reduceMotion}
                  />
                );
              })}
            </motion.ul>
          )}
        </div>
      </section>
    </div>
  );
}

type CategoryCardProps = {
  category: CategoryItem;
  direction: number;
  progress: MotionValue<number>;
  reduceMotion: boolean | null;
};

function CategoryCard({
  category,
  direction,
  progress,
  reduceMotion,
}: CategoryCardProps) {
  const y = useTransform(
    progress,
    [0, 0.5, 1],
    reduceMotion ? [0, 0, 0] : [30 * direction, 0, -34 * direction],
  );
  const rotate = useTransform(
    progress,
    [0, 1],
    reduceMotion ? [0, 0] : [-3 * direction, 3 * direction],
  );

  return (
    <motion.li variants={reduceMotion ? undefined : cardVariants}>
      <motion.div style={{ y, rotate }} className="will-change-transform">
        <AppLink
          href={category.href}
          prefetchPolicy="intent"
          aria-label={category.title}
          className="group flex h-[22.6875rem] w-[19.0625rem] max-w-full flex-col overflow-hidden rounded-[22px] bg-surface-dark p-4 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-headline"
        >
          <h3 className="min-h-14 shrink-0 text-2xl leading-tight font-black text-white">
            {category.title}
          </h3>
          <p className="mt-1 mb-1 shrink-0 text-sm text-white/80">
            {category.productCountLabel}
          </p>
          <div className="relative mt-auto min-h-0 w-full flex-1">
            <Image
              src={category.imageUrl}
              alt={category.title}
              fill
              sizes="305px"
              className="object-contain object-bottom drop-shadow-[0_18px_32px_rgba(0,0,0,0.55)] transition duration-300 ease-out group-hover:scale-110 group-hover:drop-shadow-[0_22px_40px_rgba(0,0,0,0.65)]"
            />
          </div>
        </AppLink>
      </motion.div>
    </motion.li>
  );
}

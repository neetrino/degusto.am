"use client";

import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { AppLink } from "@/components/ui/AppLink";

export type ShopCategoryItem = {
  id: string;
  slug: string;
  title: string;
  href: string;
  imageUrl: string;
  iconSrc: string;
};

type ShopCategorySidebarProps = {
  title: string;
  allLabel: string;
  searchPlaceholder: string;
  categories: readonly ShopCategoryItem[];
  selectedSlug: string;
  allHref: string;
  searchAction: string;
  searchQuery: string;
};

const COMBO_SLUGS = new Set(["combo", "combos", "kombo"]);
const EASE = [0.22, 1, 0.36, 1] as const;

const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -18 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

function isComboSlug(slug: string): boolean {
  return COMBO_SLUGS.has(slug.trim().toLowerCase());
}

function isCategoryActive(selectedSlug: string, categorySlug: string): boolean {
  if (selectedSlug === categorySlug) {
    return true;
  }
  return isComboSlug(selectedSlug) && isComboSlug(categorySlug);
}

/** Desktop sticky category sidebar — Motion slide-in + staggered links. */
export function ShopCategorySidebar({
  title,
  allLabel,
  searchPlaceholder,
  categories,
  selectedSlug,
  allHref,
  searchAction,
  searchQuery,
}: ShopCategorySidebarProps) {
  const reduceMotion = useReducedMotion();
  const isAll = selectedSlug === "all" || selectedSlug === "";

  return (
    <motion.aside
      initial={reduceMotion ? false : { opacity: 0, x: -36, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: EASE }}
      className="sticky top-[104px] hidden h-[calc(100vh-120px)] w-[min(100%,240px)] shrink-0 flex-col overflow-hidden rounded-[20px] bg-black pb-5 text-white lg:flex lg:w-[240px] xl:w-[280px] 2xl:w-[320px]"
    >
      <motion.form
        action={searchAction}
        method="get"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
        className="mx-4 mt-5 flex h-12 items-center rounded-[30px] bg-[#f3f3f5]"
      >
        {selectedSlug && selectedSlug !== "all" ? (
          <input type="hidden" name="category" value={selectedSlug} />
        ) : null}
        <label className="sr-only" htmlFor="shop-sidebar-search">
          {searchPlaceholder}
        </label>
        <input
          id="shop-sidebar-search"
          name="q"
          type="search"
          defaultValue={searchQuery}
          placeholder={searchPlaceholder}
          className="h-full min-w-0 flex-1 bg-transparent pr-2 pl-[14px] text-base leading-6 text-[#252525] outline-none placeholder:text-[rgba(105,105,105,0.56)]"
        />
        <button
          type="submit"
          className="mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#717182]"
          aria-label={searchPlaceholder}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 20L16.5 16.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </motion.form>

      <p className="px-6 pt-5 pb-3 text-[14px] font-medium tracking-[0.2px] text-[#717182] uppercase">
        {title}
      </p>

      <motion.nav
        aria-label={title}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={reduceMotion ? undefined : listVariants}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <CategoryLink
            href={allHref}
            title={allLabel}
            iconSrc="/assets/categories/icons/all.webp"
            active={isAll}
          />
        </motion.div>
        {categories.map((category) => (
          <motion.div
            key={category.id}
            variants={reduceMotion ? undefined : itemVariants}
          >
            <CategoryLink
              href={category.href}
              title={category.title}
              iconSrc={category.iconSrc}
              active={isCategoryActive(selectedSlug, category.slug)}
            />
          </motion.div>
        ))}
      </motion.nav>
    </motion.aside>
  );
}

function CategoryLink({
  href,
  title,
  iconSrc,
  active,
}: {
  href: string;
  title: string;
  iconSrc: string;
  active: boolean;
}) {
  return (
    <AppLink
      href={href}
      prefetchPolicy="intent"
      className={`flex h-10 w-full min-w-0 items-center gap-2 px-3 py-2.5 text-left text-[14px] leading-5 font-medium tracking-[-0.15px] ${
        active
          ? "rounded-[30px] bg-[#ff7f20] text-white"
          : "rounded-[10px] text-white hover:bg-white/10"
      }`}
    >
      <span className="relative size-5 shrink-0">
        <Image
          src={iconSrc}
          alt=""
          fill
          className="object-contain brightness-0 invert"
          aria-hidden
        />
      </span>
      <span className="min-w-0 truncate">{title}</span>
    </AppLink>
  );
}

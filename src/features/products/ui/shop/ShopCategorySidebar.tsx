"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { AppLink } from "@/components/ui/AppLink";
import { CategoryIconImage } from "@/features/products/ui/shop/CategoryIconImage";
import { useCatalogNavigation } from "@/features/products/ui/shop/CatalogNavContext";
import { isComboSlug } from "@/features/products/ui/shop/combo-slug";
import {
  resolveCategoryIcon,
  type CategoryIconAsset,
} from "@/features/products/ui/shop/resolve-category-icon";

export type ShopCategoryItem = {
  id: string;
  slug: string;
  title: string;
  href: string;
  imageUrl: string;
  icon: CategoryIconAsset;
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

function isCategoryActive(selectedSlug: string, categorySlug: string): boolean {
  if (selectedSlug === categorySlug) {
    return true;
  }
  return isComboSlug(selectedSlug) && isComboSlug(categorySlug);
}

/** Desktop sticky category sidebar — search + staggered category links. */
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
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { isPending, startCatalogTransition } = useCatalogNavigation();
  const [query, setQuery] = useState(searchQuery);
  const isAll = selectedSlug === "all" || selectedSlug === "";

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("q", trimmed);
    }
    if (selectedSlug && selectedSlug !== "all") {
      params.set("category", selectedSlug);
    } else {
      params.set("category", "all");
    }
    const href = params.size > 0 ? `${searchAction}?${params.toString()}` : searchAction;
    startCatalogTransition(() => {
      router.push(href);
    });
  }

  return (
    <aside className="sticky top-[104px] hidden h-[calc(100vh-120px)] w-[min(100%,240px)] shrink-0 flex-col overflow-hidden rounded-[20px] bg-black pb-5 text-white lg:flex lg:w-[240px] xl:w-[280px] 2xl:w-[320px]">
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        aria-busy={isPending}
        className="mx-4 mt-5 flex h-12 items-center rounded-[30px] bg-[#f3f3f5]"
      >
        <label className="sr-only" htmlFor="shop-sidebar-search">
          {searchPlaceholder}
        </label>
        <input
          id="shop-sidebar-search"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          disabled={isPending}
          className="h-full min-w-0 flex-1 bg-transparent pr-2 pl-[14px] text-base leading-6 text-[#252525] outline-none placeholder:text-[rgba(105,105,105,0.56)] disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={isPending}
          className="mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-[#717182] disabled:opacity-70"
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
      </form>

      <p className="px-6 pt-5 pb-3 text-[14px] font-medium tracking-[0.2px] text-[#717182] uppercase">
        {title}
      </p>

      <motion.nav
        aria-label={title}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={reduceMotion ? undefined : listVariants}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <motion.div variants={reduceMotion ? undefined : itemVariants}>
          <CategoryLink
            href={allHref}
            title={allLabel}
            icon={resolveCategoryIcon("all")}
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
              icon={category.icon}
              active={isCategoryActive(selectedSlug, category.slug)}
            />
          </motion.div>
        ))}
      </motion.nav>
    </aside>
  );
}

function CategoryLink({
  href,
  title,
  icon,
  active,
}: {
  href: string;
  title: string;
  icon: CategoryIconAsset;
  active: boolean;
}) {
  return (
    <AppLink
      href={href}
      prefetchPolicy="intent"
      className={`flex min-h-10 w-full min-w-0 items-center gap-3 px-3 py-2.5 text-left text-[14px] leading-5 font-medium tracking-[-0.15px] ${
        active
          ? "rounded-[30px] bg-[#ff7f20] text-white"
          : "rounded-[10px] text-white hover:bg-white/10"
      }`}
    >
      <CategoryIconImage icon={icon} />
      <span className="min-w-0 truncate">{title}</span>
    </AppLink>
  );
}

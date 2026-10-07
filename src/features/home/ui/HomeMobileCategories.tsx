"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";
import {
  CATEGORIES_PER_PAGE,
  CATEGORY_LOOP_COPIES,
  categoryLogicalPageCount,
  categoryLoopItemIndex,
  logicalCategoryPage,
  settledCategoryLoopIndex,
  wrapCategoryLoopIndex,
} from "@/features/home/ui/home-mobile-categories-loop";

type CategoryItem = {
  id: string;
  href: string;
  title: string;
  imageUrl: string;
};

type HomeMobileCategoriesProps = {
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
  categories: readonly CategoryItem[];
};

function CategoriesMoreChevron() {
  return (
    <svg
      width={8}
      height={13}
      viewBox="0 0 8 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="-scale-x-100"
    >
      <path
        d="M5.78 2 3.059 4.136a4.4 4.4 0 0 0-1.78 3.203 4.4 4.4 0 0 0 1.78 3.203L5.78 10.674"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryChip({ category }: { category: CategoryItem }) {
  return (
    <AppLink
      href={category.href}
      prefetchPolicy="intent"
      aria-label={category.title}
      className="min-w-0 w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66a13]"
    >
      <div className="relative mx-auto flex h-[62px] w-[59px] items-center justify-center overflow-hidden rounded-[30px] bg-[#090909]">
        <Image
          src={category.imageUrl}
          alt={category.title}
          width={40}
          height={46}
          className="relative h-[46px] w-10 object-cover"
        />
      </div>
      <p className="mt-1.5 line-clamp-2 text-center text-xs leading-5 font-normal text-black">
        {category.title}
      </p>
    </AppLink>
  );
}

function scrollToLoopPage(
  el: HTMLDivElement,
  loopIndex: number,
  behavior: ScrollBehavior,
): void {
  el.scrollTo({ left: loopIndex * el.clientWidth, behavior });
}

/**
 * Home mobile category chips — five visible, wrap-filled, infinite snap loop.
 * Layout matches Figma mobile categories (node 1:1202).
 */
export function HomeMobileCategories({
  title,
  viewAllLabel,
  viewAllHref,
  categories,
}: HomeMobileCategoriesProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const logicalCount = categoryLogicalPageCount(categories.length);
  const [page, setPage] = useState(0);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || logicalCount === 0) {
      return;
    }

    scrollToLoopPage(el, logicalCount, "auto");
    setPage(0);

    function sync(): void {
      if (!el || logicalCount === 0) {
        return;
      }
      const width = el.clientWidth;
      const settledIndex = settledCategoryLoopIndex(el.scrollLeft, width);
      if (settledIndex === null) {
        setPage(
          logicalCategoryPage(
            Math.round(el.scrollLeft / Math.max(1, width)),
            logicalCount,
          ),
        );
        return;
      }
      const wrapped = wrapCategoryLoopIndex(settledIndex, logicalCount);
      if (wrapped.jumped) {
        scrollToLoopPage(el, wrapped.index, "auto");
      }
      setPage(logicalCategoryPage(wrapped.index, logicalCount));
    }

    function onResize(): void {
      if (!el) {
        return;
      }
      const current = logicalCategoryPage(
        Math.round(el.scrollLeft / Math.max(1, el.clientWidth)),
        logicalCount,
      );
      scrollToLoopPage(el, logicalCount + current, "auto");
      setPage(current);
    }

    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", onResize);
    };
  }, [logicalCount, categories.length]);

  function goToPage(index: number): void {
    const el = scrollerRef.current;
    if (!el || logicalCount <= 1) {
      return;
    }
    scrollToLoopPage(el, logicalCount + index, "smooth");
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 px-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base leading-5 font-semibold text-black">
          {title}
        </h2>
        <AppLink
          href={viewAllHref}
          prefetchPolicy="intent"
          className="inline-flex items-center gap-[5px] rounded-full py-0.5 pl-2 text-base leading-6 font-bold text-[#f66a13]"
        >
          {viewAllLabel}
          <CategoriesMoreChevron />
        </AppLink>
      </div>

      <div
        ref={scrollerRef}
        className="flex overflow-x-auto overscroll-x-contain pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: CATEGORY_LOOP_COPIES }, (_, copy) =>
          Array.from({ length: logicalCount }, (_, pageIndex) => (
            <div
              key={`category-copy-${copy}-page-${pageIndex}`}
              className="grid w-full shrink-0 basis-full grid-cols-5 snap-start snap-always"
            >
              {Array.from({ length: CATEGORIES_PER_PAGE }, (_, slot) => {
                const item =
                  categories[
                    categoryLoopItemIndex(
                      categories.length,
                      pageIndex,
                      slot,
                    )
                  ];
                if (!item) {
                  return null;
                }
                return (
                  <CategoryChip
                    key={`${copy}-${pageIndex}-${slot}-${item.id}`}
                    category={item}
                  />
                );
              })}
            </div>
          )),
        )}
      </div>

      {logicalCount > 1 ? (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: logicalCount }, (_, index) => (
            <button
              key={`category-dot-${index}`}
              type="button"
              aria-label={`Go to category page ${index + 1}`}
              aria-current={index === page}
              className={
                index === page
                  ? "h-1 w-5 rounded-[12px] bg-[#ff7f20] transition-colors"
                  : "h-1 w-5 rounded-[12px] bg-[#ffeacc] transition-colors"
              }
              onClick={() => goToPage(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

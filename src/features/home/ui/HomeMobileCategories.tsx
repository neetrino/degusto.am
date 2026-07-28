"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { AppLink } from "@/components/ui/AppLink";

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

function pageCountFromScroll(el: HTMLDivElement): number {
  if (el.scrollWidth <= el.clientWidth + 8) {
    return 1;
  }
  return Math.max(2, Math.round(el.scrollWidth / el.clientWidth));
}

function activePageFromScroll(el: HTMLDivElement, pages: number): number {
  if (pages <= 1) {
    return 0;
  }
  const maxScroll = el.scrollWidth - el.clientWidth;
  if (maxScroll <= 0) {
    return 0;
  }
  return Math.min(pages - 1, Math.round((el.scrollLeft / maxScroll) * (pages - 1)));
}

/**
 * Home mobile category chips with horizontal snap paging dots.
 */
export function HomeMobileCategories({
  title,
  viewAllLabel,
  viewAllHref,
  categories,
}: HomeMobileCategoriesProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || categories.length === 0) {
      return;
    }

    function sync(): void {
      if (!el) {
        return;
      }
      const pages = pageCountFromScroll(el);
      setPageCount(pages);
      setPage(activePageFromScroll(el, pages));
    }

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [categories.length]);

  function goToPage(index: number): void {
    const el = scrollerRef.current;
    if (!el || pageCount <= 1) {
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    const left = (index / (pageCount - 1)) * maxScroll;
    el.scrollTo({ left, behavior: "smooth" });
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 px-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base leading-5 font-semibold text-black">
          {title}
        </h2>
        <AppLink
          href={viewAllHref}
          prefetchPolicy="intent"
          className="inline-flex items-center justify-center rounded-full px-2 py-1 text-base leading-6 font-bold text-[#f66a13]"
        >
          {viewAllLabel}
        </AppLink>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max items-start gap-2">
          {categories.map((category) => (
            <AppLink
              key={category.id}
              href={category.href}
              prefetchPolicy="intent"
              aria-label={category.title}
              className="w-14 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66a13]"
            >
              <div className="relative mx-auto flex h-[72px] w-12 items-center justify-center rounded-[24px] bg-[#090909]">
                <Image
                  src={category.imageUrl}
                  alt={category.title}
                  width={40}
                  height={42}
                  className="relative h-[42px] w-10 rounded-[10px] object-cover"
                />
              </div>
              <p className="mt-1.5 line-clamp-2 text-center text-xs leading-5 text-black">
                {category.title}
              </p>
            </AppLink>
          ))}
        </div>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-1">
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={`category-page-${index}`}
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

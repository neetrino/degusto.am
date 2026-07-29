"use client";

import Image from "next/image";
import { ChevronRight, LoaderCircle, SearchX } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";

export type HeaderSearchSuggestion = {
  id: string;
  href: string;
  title: string;
  categoryLabel: string | null;
  priceFormatted: string;
  compareAtFormatted: string | null;
  imageUrl: string | null;
};

type HeaderSearchDropdownProps = {
  status: "loading" | "empty" | "results";
  items: readonly HeaderSearchSuggestion[];
  loadingLabel: string;
  emptyLabel: string;
  seeAllLabel: string;
  seeAllHref: string;
  onNavigate: () => void;
};

const PANEL_EASE = [0.22, 1, 0.36, 1] as const;

function trapListWheel(event: WheelEvent): void {
  event.stopPropagation();
  const el = event.currentTarget as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const canScroll = scrollHeight > clientHeight + 1;
  if (!canScroll) {
    event.preventDefault();
    return;
  }

  const delta = event.deltaY;
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
  if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
    event.preventDefault();
  }
}

function trapPanelWheel(event: WheelEvent): void {
  event.stopPropagation();
  const panel = event.currentTarget as HTMLElement;
  const list = panel.querySelector<HTMLElement>("[data-header-search-scroll]");
  const target = event.target as Node | null;
  if (list && target && list.contains(target)) {
    return;
  }
  event.preventDefault();
}

/** Header search panel — loading, empty, or product suggestions. */
export function HeaderSearchDropdown({
  status,
  items,
  loadingLabel,
  emptyLabel,
  seeAllLabel,
  seeAllHref,
  onNavigate,
}: HeaderSearchDropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    panel.addEventListener("wheel", trapPanelWheel, { passive: false });
    return () => panel.removeEventListener("wheel", trapPanelWheel);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) {
      return;
    }
    list.addEventListener("wheel", trapListWheel, { passive: false });
    return () => list.removeEventListener("wheel", trapListWheel);
  }, [status, items.length]);

  return (
    <motion.div
      ref={panelRef}
      role="listbox"
      data-lenis-prevent
      data-lenis-prevent-wheel
      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: PANEL_EASE }}
      className="absolute top-[calc(100%+10px)] left-1/2 z-50 w-[min(100vw-2rem,380px)] -translate-x-1/2 overflow-hidden rounded-[22px] border border-black/[0.06] bg-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35),0_8px_20px_-8px_rgba(0,0,0,0.18)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent"
      />

      {status === "loading" ? (
        <div
          className="flex flex-col items-center justify-center gap-3 px-6 py-12"
          aria-busy="true"
          aria-live="polite"
        >
          <LoaderCircle
            className="size-8 animate-spin text-brand"
            strokeWidth={2}
            aria-hidden
          />
          <p className="text-sm font-medium tracking-tight text-[#6b6b6b]">
            {loadingLabel}
          </p>
        </div>
      ) : null}

      {status === "empty" ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-11 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-[#fff4eb]">
            <SearchX className="size-5 text-brand" strokeWidth={2} aria-hidden />
          </span>
          <p className="max-w-[16rem] text-sm leading-snug font-medium text-[#5c5c5c]">
            {emptyLabel}
          </p>
        </div>
      ) : null}

      {status === "results" ? (
        <ul
          ref={listRef}
          data-header-search-scroll
          data-lenis-prevent
          data-lenis-prevent-wheel
          className="max-h-[340px] space-y-0.5 overflow-y-auto overscroll-contain p-2 [scrollbar-color:rgba(255,127,32,0.45)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-brand/40 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          {items.map((item, index) => (
            <motion.li
              key={item.id}
              role="option"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.22,
                ease: PANEL_EASE,
                delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.18),
              }}
            >
              <AppLink
                href={item.href}
                prefetchPolicy="intent"
                onClick={onNavigate}
                className="group flex items-center gap-3 rounded-[16px] px-2.5 py-2.5 transition-colors duration-200 hover:bg-[#fff4eb] focus-visible:bg-[#fff4eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="relative size-[58px] shrink-0 overflow-hidden rounded-[14px] bg-[#f3f3f4] ring-1 ring-black/[0.04]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="58px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-[#b0b0b0]">
                      —
                    </span>
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] leading-tight font-semibold tracking-tight text-[#1a1a1a] transition-colors group-hover:text-brand-headline">
                    {item.title}
                  </span>
                  {item.categoryLabel ? (
                    <span className="mt-1 block truncate text-[12px] leading-none text-[#8a8a8a]">
                      {item.categoryLabel}
                    </span>
                  ) : null}
                  <span className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-[15px] font-bold tracking-tight text-brand tabular-nums">
                      {item.priceFormatted}
                    </span>
                    {item.compareAtFormatted ? (
                      <span className="text-[12px] text-[#a3a3a3] line-through tabular-nums">
                        {item.compareAtFormatted}
                      </span>
                    ) : null}
                  </span>
                </span>

                <ChevronRight
                  className="size-4 shrink-0 text-[#cfcfcf] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </AppLink>
            </motion.li>
          ))}
        </ul>
      ) : null}

      {status !== "loading" ? (
        <div className="border-t border-black/[0.06] bg-gradient-to-b from-[#fafafa] to-white p-2.5">
          <AppLink
            href={seeAllHref}
            prefetchPolicy="intent"
            onClick={onNavigate}
            className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-[14px] font-semibold text-white shadow-[0_8px_18px_-6px_rgba(255,127,32,0.65)] transition hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {seeAllLabel}
            <ChevronRight className="size-4" strokeWidth={2.5} aria-hidden />
          </AppLink>
        </div>
      ) : null}
    </motion.div>
  );
}

"use client";

import { useEffect, useRef } from "react";

import { AppLink } from "@/components/ui/AppLink";
import { CategoryIconImage } from "@/features/products/ui/shop/CategoryIconImage";
import { isComboSlug } from "@/features/products/ui/shop/combo-slug";
import {
  resolveCategoryIcon,
  type CategoryIconAsset,
} from "@/features/products/ui/shop/resolve-category-icon";
import type { ShopCategoryItem } from "@/features/products/ui/shop/ShopCategorySidebar";

type ShopMobileCategoryChipsProps = {
  label: string;
  allLabel: string;
  allHref: string;
  categories: readonly ShopCategoryItem[];
  selectedSlug: string;
};

function isChipActive(selectedSlug: string, categorySlug: string): boolean {
  if (selectedSlug === categorySlug) {
    return true;
  }
  return isComboSlug(selectedSlug) && isComboSlug(categorySlug);
}

/** Mobile-only horizontal category pills with Figma icons. */
export function ShopMobileCategoryChips({
  label,
  allLabel,
  allHref,
  categories,
  selectedSlug,
}: ShopMobileCategoryChipsProps) {
  const isAll = selectedSlug === "all" || selectedSlug === "";
  const activeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "instant",
    });
  }, [selectedSlug]);

  return (
    <nav
      aria-label={label}
      className="-mx-4 mt-4 overflow-x-auto px-4 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max items-center gap-2 pb-1">
        <li ref={isAll ? activeRef : undefined}>
          <CategoryChip
            href={allHref}
            title={allLabel}
            icon={resolveCategoryIcon("all")}
            active={isAll}
          />
        </li>
        {categories.map((category) => {
          const active = isChipActive(selectedSlug, category.slug);
          return (
            <li key={category.id} ref={active ? activeRef : undefined}>
              <CategoryChip
                href={category.href}
                title={category.title}
                icon={category.icon}
                active={active}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function CategoryChip({
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
      aria-current={active ? "page" : undefined}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[12px] font-semibold tracking-[0.4px] uppercase ${
        active
          ? "border-[#ff7f20] bg-[#ff7f20] text-white"
          : "border-[#252525] bg-white text-[#252525]"
      }`}
    >
      <span className="inline-flex size-[18px] shrink-0 items-center justify-center overflow-hidden">
        <span className="origin-center scale-[0.75]">
          <CategoryIconImage
            icon={icon}
            imageClassName={active ? undefined : "brightness-0"}
          />
        </span>
      </span>
      <span className="whitespace-nowrap">{title}</span>
    </AppLink>
  );
}

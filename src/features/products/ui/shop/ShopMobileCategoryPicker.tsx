import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";
import type { ShopCategoryItem } from "@/features/products/ui/shop/ShopCategorySidebar";

type ShopMobileCategoryPickerProps = {
  title: string;
  categories: readonly ShopCategoryItem[];
};

function CategoryCard({ category }: { category: ShopCategoryItem }) {
  return (
    <AppLink
      href={category.href}
      prefetchPolicy="intent"
      aria-label={category.title}
      className="relative h-[183px] overflow-hidden rounded-[28px] bg-[#090909] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f66a13]"
    >
      <p className="relative z-10 line-clamp-2 px-[13px] pt-[21px] pr-2 text-[12px] leading-[18px] font-medium text-white">
        {category.title}
      </p>
      {category.imageUrl ? (
        <div className="pointer-events-none absolute top-10 right-2 bottom-2 left-1">
          <Image
            src={category.imageUrl}
            alt=""
            fill
            sizes="45vw"
            className="object-contain object-right-bottom"
          />
        </div>
      ) : null}
    </AppLink>
  );
}

/** Mobile kitchen grid — Figma mobile shop category cards. */
export function ShopMobileCategoryPicker({
  title,
  categories,
}: ShopMobileCategoryPickerProps) {
  return (
    <section className="flex flex-col gap-[22px]">
      <h1 className="text-base leading-5 font-semibold text-black">{title}</h1>
      {categories.length === 0 ? null : (
        <nav
          aria-label={title}
          className="grid grid-cols-2 gap-x-[14px] gap-y-[22px]"
        >
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </nav>
      )}
    </section>
  );
}

import Image from "next/image";

import { AppLink } from "@/components/ui/AppLink";

import type { ShopCategoryItem } from "@/features/products/ui/shop/ShopCategorySidebar";

type ShopMobileCategoriesProps = {
  title: string;
  allLabel: string;
  allHref: string;
  allImageUrl: string;
  categories: readonly ShopCategoryItem[];
};

/** Mobile-only category card grid before entering the product list. */
export function ShopMobileCategories({
  title,
  allLabel,
  allHref,
  allImageUrl,
  categories,
}: ShopMobileCategoriesProps) {
  return (
    <section>
      <h1 className="text-base leading-5 font-semibold text-black">{title}</h1>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-[14px]">
        <CategoryCard href={allHref} title={allLabel} imageUrl={allImageUrl} />
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            href={category.href}
            title={category.title}
            imageUrl={category.imageUrl}
          />
        ))}
      </div>
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

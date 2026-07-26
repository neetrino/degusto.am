import Image from "next/image";

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

export function HomeCategories({
  title,
  emptyLabel,
  categories,
}: HomeCategoriesProps) {
  return (
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen rounded-t-[40px] bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-10 font-display text-3xl font-bold tracking-tight text-black sm:text-4xl md:text-5xl lg:text-[60px] lg:leading-none">
          {title}
        </h2>

        {categories.length === 0 ? (
          <p className="text-gray-600">{emptyLabel}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id}>
                <AppLink
                  href={category.href}
                  prefetchPolicy="intent"
                  className="group relative flex h-[320px] flex-col overflow-hidden rounded-[28px] bg-black p-6 transition hover:-translate-y-0.5 sm:h-[363px]"
                >
                  <div className="relative z-10">
                    <h3 className="max-w-[241px] text-xl font-bold leading-tight text-white sm:text-2xl sm:leading-[33.6px]">
                      {category.title}
                    </h3>
                    <p className="mt-2 text-base text-white/90">
                      {category.productCountLabel}
                    </p>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[28%] flex items-end justify-center">
                    <div className="relative h-[70%] w-[85%] transition duration-300 group-hover:scale-105">
                      <Image
                        src={category.imageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                        className="object-contain object-bottom"
                      />
                    </div>
                  </div>
                </AppLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

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

/** Desktop categories grid — live degusto-am / Figma parity. */
export function HomeCategories({
  title,
  emptyLabel,
  categories,
}: HomeCategoriesProps) {
  return (
    <div className="relative left-1/2 right-1/2 hidden w-screen -ml-[50vw] -mr-[50vw] bg-black lg:block">
      <section className="rounded-t-[40px] bg-surface-muted pt-10 pb-20 md:pb-24">
        <div className="mx-auto w-full max-w-[min(1450px,calc(100%-2rem))] px-4 md:max-w-[min(1450px,calc(100%-2.5rem))] md:px-6 lg:max-w-[min(1450px,calc(100%-3rem))]">
          <h2 className="mb-8 font-display text-5xl font-black tracking-tight text-black md:text-6xl">
            {title}
          </h2>

          {categories.length === 0 ? (
            <p className="text-gray-600">{emptyLabel}</p>
          ) : (
            <ul className="grid grid-cols-1 justify-items-center gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <li key={category.id}>
                  <AppLink
                    href={category.href}
                    prefetchPolicy="intent"
                    aria-label={category.title}
                    className="group flex h-[22.6875rem] w-[19.0625rem] max-w-full flex-col overflow-hidden rounded-[22px] bg-surface-dark p-4 transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-headline"
                  >
                    <h3 className="min-h-14 shrink-0 text-2xl font-black leading-tight text-white">
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

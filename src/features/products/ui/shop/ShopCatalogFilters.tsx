"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useCatalogNavigation } from "@/features/products/ui/shop/CatalogNavContext";
import {
  DietSwitcher,
  type DietSwitcherMode,
} from "@/features/products/ui/shop/DietSwitcher";

type ShopCatalogFiltersProps = {
  priceLabel: string;
  priceFromLabel: string;
  priceToLabel: string;
  dietFilterLabel: string;
  dietNoneLabel: string;
  dietVegetarianLabel: string;
  dietSpicyLabel: string;
  minPrice: string;
  maxPrice: string;
  diet: DietSwitcherMode;
};

/** Price range + Figma diet Switcher synced to URL search params. */
export function ShopCatalogFilters({
  priceLabel,
  priceFromLabel,
  priceToLabel,
  dietFilterLabel,
  dietNoneLabel,
  dietVegetarianLabel,
  dietSpicyLabel,
  minPrice,
  maxPrice,
  diet,
}: ShopCatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isPending: pending, startCatalogTransition } = useCatalogNavigation();
  const [fromValue, setFromValue] = useState(minPrice);
  const [toValue, setToValue] = useState(maxPrice);
  const [dietValue, setDietValue] = useState(diet);
  const [prevDietProp, setPrevDietProp] = useState(diet);

  // Keep local ball position in sync when URL diet changes (back/forward).
  if (diet !== prevDietProp) {
    setPrevDietProp(diet);
    setDietValue(diet);
  }

  function pushParams(mutate: (params: URLSearchParams) => void): void {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    const query = params.toString();
    startCatalogTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function commitPrice(): void {
    pushParams((params) => {
      if (fromValue.trim()) params.set("min", fromValue.trim());
      else params.delete("min");
      if (toValue.trim()) params.set("max", toValue.trim());
      else params.delete("max");
    });
  }

  function setDiet(next: DietSwitcherMode): void {
    if (next === dietValue) {
      return;
    }
    setDietValue(next);
    pushParams((params) => {
      if (next === "none") params.delete("diet");
      else params.set("diet", next);
    });
  }

  return (
    <div
      className={`hidden flex-col gap-2 text-sm text-[#717182] xl:flex xl:flex-row xl:flex-wrap xl:items-center xl:pt-[37px] ${pending ? "opacity-80" : ""}`}
    >
      <span className="w-auto shrink-0 px-1 text-base">{priceLabel}</span>
      <div className="flex w-auto min-w-0 flex-nowrap items-center gap-2">
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder={priceFromLabel}
          value={fromValue}
          onChange={(event) => setFromValue(event.target.value)}
          onBlur={commitPrice}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitPrice();
          }}
          className="h-[46px] w-[109px] shrink-0 rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80]"
          max={2_147_483_647}
        />
        <input
          type="number"
          min={0}
          max={2_147_483_647}
          inputMode="numeric"
          placeholder={priceToLabel}
          value={toValue}
          onChange={(event) => setToValue(event.target.value)}
          onBlur={commitPrice}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitPrice();
          }}
          className="h-[46px] w-[109px] shrink-0 rounded-[40px] bg-[#f3f3f5] px-4 text-left text-base text-[#7f7f80]"
        />

        <DietSwitcher
          value={dietValue}
          onChange={setDiet}
          ariaLabel={dietFilterLabel}
          spicyLabel={dietSpicyLabel}
          noneLabel={dietNoneLabel}
          vegetarianLabel={dietVegetarianLabel}
        />
      </div>
    </div>
  );
}

"use client";

import { useParams } from "next/navigation";

import { CatalogGridSkeleton } from "@/components/loading/storefront-skeletons";
import { ShopCatalogLoadingState } from "@/features/products/ui/shop/ShopCatalogLoadingState";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default function ProductsLoading() {
  const params = useParams();
  const rawLocale = typeof params.locale === "string" ? params.locale : "hy";
  const locale = isLocale(rawLocale) ? rawLocale : "hy";
  const label = getDictionary(locale).catalog.loadingProducts;

  return (
    <div className="mx-auto flex w-full max-w-[min(1450px,calc(100%-2rem))] flex-col gap-6 px-4 py-8 md:px-6">
      <ShopCatalogLoadingState label={label} />
      <CatalogGridSkeleton />
    </div>
  );
}

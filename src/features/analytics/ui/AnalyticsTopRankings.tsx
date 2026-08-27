import { Package, ShoppingBag, Tag, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type {
  AnalyticsTopCategory,
  AnalyticsTopProduct,
} from "@/features/analytics/application/queries";

type AnalyticsTopRankingsProps = {
  products: AnalyticsTopProduct[];
  categories: AnalyticsTopCategory[];
  formatMoney: (amount: number) => string;
};

function RankBadge({
  rank,
  tone,
}: {
  rank: number;
  tone: "amber" | "violet";
}) {
  const classes =
    tone === "amber"
      ? "bg-amber-400 text-white"
      : "bg-violet-500 text-white";

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${classes}`}
    >
      {rank}
    </div>
  );
}

export function AnalyticsTopRankings({
  products,
  categories,
  formatMoney,
}: AnalyticsTopRankingsProps) {
  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#1f1a17]">
            Թոփ վաճառվող ապրանքներ
          </h2>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#ff7f20]">
            <TrendingUp className="h-4 w-4" aria-hidden />
          </div>
        </div>
        <div className="space-y-3">
          {products.map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-3"
            >
              <RankBadge rank={index + 1} tone="amber" />
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- remote R2 URLs; admin list pattern
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-5 w-5 text-[#8a837a]" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1f1a17]">
                  {product.title}
                </p>
                <p className="truncate text-xs text-[#8a837a]">{product.sku}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8a837a]">
                  <span className="inline-flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" aria-hidden />
                    {product.quantitySold} վաճառք
                  </span>
                  <span>|</span>
                  <span>{product.orderCount} պատվեր</span>
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-[#1f1a17]">
                {formatMoney(product.unitPriceAmount)}
              </p>
            </div>
          ))}
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#8a837a]">
              Այս միջակայքում վաճառքներ չկան։
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#1f1a17]">Թոփ կատեգորիաներ</h2>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Tag className="h-4 w-4" aria-hidden />
          </div>
        </div>
        <div className="space-y-3">
          {categories.map((category, index) => (
            <div
              key={category.categoryId}
              className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/40 p-3"
            >
              <RankBadge rank={index + 1} tone="violet" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1f1a17]">
                  {category.title}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#8a837a]">
                  <span>{category.itemCount} ապրանք</span>
                  <span>|</span>
                  <span>{category.orderCount} պատվեր</span>
                </p>
              </div>
              <p className="shrink-0 text-sm font-bold text-[#1f1a17]">
                {formatMoney(category.revenueAmount)}
              </p>
            </div>
          ))}
          {categories.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#8a837a]">
              Այս միջակայքում կատեգորիաներ չկան։
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

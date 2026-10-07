"use client";

import { Package } from "lucide-react";
import { useState, useTransition } from "react";

import { Card } from "@/components/ui/Card";
import type { AnalyticsTodaySoldItem } from "@/features/analytics/application/today-sold-items";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { getAdminOrderDetailAction } from "@/features/orders/application/get-order-detail";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import type { AdminOrderCapabilities } from "@/features/orders/ui/AdminOrdersView";
import { isLocale } from "@/lib/i18n/config";
import { formatMoneyAmount } from "@/lib/money/format";

type AnalyticsTodaySoldProductsProps = {
  locale: string;
  items: AnalyticsTodaySoldItem[];
  capabilities: AdminOrderCapabilities;
};

/** Today's sold line items — click opens admin order details drawer. */
export function AnalyticsTodaySoldProducts({
  locale,
  items,
  capabilities,
}: AnalyticsTodaySoldProductsProps) {
  const moneyLocale = isLocale(locale) ? locale : "hy";
  const formatMoney = (amount: number): string =>
    formatMoneyAmount(amount, "AMD", moneyLocale);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openOrder(orderNumber: string): void {
    setDrawerOpen(true);
    setDetail(null);
    setError(null);

    startTransition(async () => {
      const result = await getAdminOrderDetailAction(locale, orderNumber);
      if (!result.ok) {
        setError(result.error.message);
        setDetail(null);
        return;
      }
      setDetail(result.value);
    });
  }

  function closeDrawer(): void {
    setDrawerOpen(false);
    setDetail(null);
    setError(null);
  }

  function refreshDetail(): void {
    if (!detail?.orderNumber) {
      return;
    }

    startTransition(async () => {
      const result = await getAdminOrderDetailAction(locale, detail.orderNumber);
      if (result.ok) {
        setDetail(result.value);
      }
    });
  }

  return (
    <section className="mb-6">
      <Card className="rounded-2xl p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#1f1a17]">
            Այսօր · վաճառված բոլոր ապրանքներ
          </h2>
          <p className="text-xs font-medium text-[#8a837a]">
            {items.length} տող · սեղմիր՝ պատվերի դետալները տեսնելու համար
          </p>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#8a837a]">
            Այսօր վաճառքներ չկան։
          </p>
        ) : (
          <ul className="divide-y divide-[#f0ebe3] rounded-xl border border-[#ead7bf]/80">
            {items.map((item) => (
              <li key={item.orderItemId}>
                <button
                  type="button"
                  onClick={() => openOrder(item.orderNumber)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-[#fff8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7f20]/45 focus-visible:ring-inset"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f7f2ea]">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote R2 URLs; admin list pattern
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-[#8a837a]" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#1f1a17]">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-[#8a837a]">
                      {item.orderNumber} · ×{item.quantity} · {item.sku}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-[#1f1a17]">
                    {formatMoney(item.lineTotalAmount)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <OrderDetailsDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        locale={locale}
        detail={detail}
        error={error}
        isLoading={isPending}
        capabilities={capabilities}
        onDetailRefresh={refreshDetail}
      />
    </section>
  );
}

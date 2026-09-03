"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { getCustomerOrderDetailAction } from "@/features/orders/application/get-customer-order-detail";
import { reorderCustomerOrderAction } from "@/features/orders/application/reorder-customer-order";
import { requestOpenCartDrawer } from "@/features/cart/ui/cart-drawer-events";
import { CustomerOrdersTable } from "@/features/orders/ui/CustomerOrdersTable";
import { OrderDetailsDrawer } from "@/features/orders/ui/OrderDetailsDrawer";
import { getOrderDrawerCopy } from "@/features/orders/ui/order-drawer-copy";

type CustomerOrdersViewOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
};

type CustomerOrdersViewProps = {
  locale: string;
  orders: CustomerOrdersViewOrder[];
};

export function CustomerOrdersView({ locale, orders }: CustomerOrdersViewProps) {
  const router = useRouter();
  const copy = getOrderDrawerCopy(locale);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<AdminOrderDetailView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingDetail, startDetailTransition] = useTransition();
  const [isReordering, startReorderTransition] = useTransition();

  function openOrder(orderNumber: string): void {
    setDrawerOpen(true);
    setDetail(null);
    setError(null);

    startDetailTransition(async () => {
      const result = await getCustomerOrderDetailAction(locale, orderNumber);
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

  function reorderCurrentOrder(): void {
    if (!detail || isReordering) {
      return;
    }

    startReorderTransition(async () => {
      const result = await reorderCustomerOrderAction(locale, detail.orderNumber);
      if (!result.ok) {
        window.alert(result.error.message);
        return;
      }

      closeDrawer();
      requestOpenCartDrawer("reorder");

      const lines = result.value.unavailableTitles
        .map((title) => `• ${title}`)
        .join("\n");
      if (result.value.unavailableTitles.length > 0) {
        const prefix =
          result.value.addedLines > 0 ? `${copy.reorderPartial}\n\n` : "";
        window.alert(`${prefix}${copy.reorderUnavailable}\n${lines}`);
      }

      router.refresh();
    });
  }

  return (
    <>
      <CustomerOrdersTable orders={orders} onOpenOrder={openOrder} />
      <OrderDetailsDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        locale={locale}
        detail={detail}
        error={error}
        isLoading={isLoadingDetail}
        capabilities={{
          canChangeOrderStatus: false,
          canChangePaymentStatus: false,
          canArchiveOrders: false,
        }}
        onReorder={reorderCurrentOrder}
        isReordering={isReordering}
      />
    </>
  );
}

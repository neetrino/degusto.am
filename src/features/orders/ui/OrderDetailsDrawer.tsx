"use client";

import { SideSheet } from "@/components/ui/SideSheet";
import { ADMIN_SHEET_SURFACE } from "@/features/admin/ui/admin-form-classes";
import { AdminSheetHeader } from "@/features/admin/ui/AdminSheetHeader";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { OrderDetailsDrawerItems } from "@/features/orders/ui/OrderDetailsDrawerItems";
import { OrderDetailsDrawerShipping } from "@/features/orders/ui/OrderDetailsDrawerShipping";
import { OrderDetailsDrawerSummary } from "@/features/orders/ui/OrderDetailsDrawerSummary";
import { OrderDetailsDrawerTotals } from "@/features/orders/ui/OrderDetailsDrawerTotals";

type OrderDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  detail: AdminOrderDetailView | null;
  error: string | null;
  isLoading: boolean;
};

export function OrderDetailsDrawer({
  open,
  onClose,
  detail,
  error,
  isLoading,
}: OrderDetailsDrawerProps) {
  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel="Order Details"
      panelClassName="w-[min(100%,42rem)] sm:w-[min(70%,52rem)]"
      surfaceClassName={ADMIN_SHEET_SURFACE}
      closeTone="brand"
      backdropBlur
    >
      <AdminSheetHeader
        title="Order Details"
        subtitle={detail ? `#${detail.orderNumber}` : null}
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {isLoading ? (
          <p className="py-4 text-sm text-[#5c564e]">Loading order…</p>
        ) : null}
        {error ? <p className="py-4 text-sm text-red-700">{error}</p> : null}
        {!isLoading && !error && detail ? (
          <>
            <OrderDetailsDrawerSummary detail={detail} />
            <OrderDetailsDrawerShipping detail={detail} />
            <OrderDetailsDrawerTotals detail={detail} />
            <OrderDetailsDrawerItems detail={detail} />
          </>
        ) : null}
      </div>
    </SideSheet>
  );
}

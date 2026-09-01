"use client";

import { SideSheet } from "@/components/ui/SideSheet";
import { ADMIN_SHEET_SURFACE } from "@/features/admin/ui/admin-form-classes";
import { AdminSheetHeader } from "@/features/admin/ui/AdminSheetHeader";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  formatOrderDrawerHeaderSubtitle,
  formatOrderDrawerHeaderTitle,
  getOrderDrawerAriaLabel,
  getOrderDrawerLoadingLabel,
  OrderDetailsDrawerContent,
} from "@/features/orders/ui/OrderDetailsDrawerContent";
import type { AdminOrderCapabilities } from "@/features/orders/ui/AdminOrdersView";

type OrderDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  locale: string;
  detail: AdminOrderDetailView | null;
  error: string | null;
  isLoading: boolean;
  capabilities: AdminOrderCapabilities;
  onDetailRefresh?: () => void;
};

export function OrderDetailsDrawer({
  open,
  onClose,
  locale,
  detail,
  error,
  isLoading,
  capabilities,
  onDetailRefresh,
}: OrderDetailsDrawerProps) {
  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={getOrderDrawerAriaLabel(locale)}
      panelClassName="w-[min(100%,40rem)] sm:w-[min(92%,44rem)] lg:w-[min(75%,48rem)]"
      surfaceClassName={ADMIN_SHEET_SURFACE}
      closeTone="brand"
      backdropBlur
    >
      <AdminSheetHeader
        title={
          detail
            ? formatOrderDrawerHeaderTitle(locale, detail.orderNumber)
            : getOrderDrawerAriaLabel(locale)
        }
        subtitle={
          detail
            ? formatOrderDrawerHeaderSubtitle(locale, detail.placedAt)
            : null
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {isLoading ? (
          <p className="py-4 text-sm text-[#5c564e]">
            {getOrderDrawerLoadingLabel(locale)}
          </p>
        ) : null}
        {error ? <p className="py-4 text-sm text-red-700">{error}</p> : null}
        {!isLoading && !error && detail ? (
          <OrderDetailsDrawerContent
            locale={locale}
            detail={detail}
            capabilities={capabilities}
            onStatusChanged={onDetailRefresh}
          />
        ) : null}
      </div>
    </SideSheet>
  );
}

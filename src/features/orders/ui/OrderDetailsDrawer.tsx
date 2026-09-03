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
import { getOrderDrawerCopy } from "@/features/orders/ui/order-drawer-copy";
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
  onReorder?: () => void;
  isReordering?: boolean;
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
  onReorder,
  isReordering = false,
}: OrderDetailsDrawerProps) {
  const copy = getOrderDrawerCopy(locale);

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={getOrderDrawerAriaLabel(locale)}
      panelClassName="w-[min(100%,40rem)] sm:w-[min(92%,44rem)] lg:w-[min(75%,48rem)]"
      surfaceClassName={ADMIN_SHEET_SURFACE}
      zIndexClassName="z-[1300]"
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
      >
        {detail && onReorder ? (
          <div className="absolute top-4 right-5 sm:top-5 sm:right-6">
            <button
              type="button"
              onClick={onReorder}
              disabled={isReordering}
              className="inline-flex h-9 items-center rounded-full bg-[#ff7f20] px-3.5 text-xs font-semibold text-white transition-[filter,transform] hover:brightness-95 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:brightness-100 disabled:hover:translate-y-0"
            >
              {isReordering ? copy.reordering : copy.reorderCta}
            </button>
          </div>
        ) : null}
      </AdminSheetHeader>

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

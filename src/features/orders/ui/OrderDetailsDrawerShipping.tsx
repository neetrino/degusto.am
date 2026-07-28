import { MapPin } from "lucide-react";

import {
  ADMIN_BADGE,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import {
  formatOrderDrawerMoney,
  formatOrderStatusLabel,
} from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerShippingProps = {
  detail: AdminOrderDetailView;
};

export function OrderDetailsDrawerShipping({
  detail,
}: OrderDetailsDrawerShippingProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-2xl border border-[#ead7bf] px-5 py-4">
        <h3 className="mb-4 text-base font-semibold text-[#1f1a17]">
          Shipping Address
        </h3>
        <dl className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-[#8a837a]">Shipping Method:</dt>
            <dd className="font-medium text-[#1f1a17]">{detail.shippingMethod}</dd>
          </div>
          {detail.isPickup ? (
            <div className="flex flex-wrap items-center gap-x-2">
              <dt className="text-[#8a837a]">Pickup store:</dt>
              <dd className="font-medium text-[#1f1a17]">{detail.storeName}</dd>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <MapPin
              className="h-4 w-4 shrink-0 text-[#8a837a]"
              aria-hidden
            />
            <dd className="min-w-0 font-medium text-[#1f1a17]">
              {detail.addressLine}
            </dd>
          </div>
          {detail.addressHint ? (
            <p className="text-xs text-[#8a837a]">{detail.addressHint}</p>
          ) : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-[#ead7bf] px-5 py-4">
        <h3 className="mb-4 text-base font-semibold text-[#1f1a17]">Payment</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-[#8a837a]">Method:</dt>
            <dd className="font-medium text-[#1f1a17]">{detail.paymentMethod}</dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-[#8a837a]">Amount:</dt>
            <dd className="font-medium text-[#1f1a17]">
              {formatOrderDrawerMoney(
                detail.paymentAmount,
                detail.baseCurrency,
              )}
            </dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-2">
            <dt className="text-[#8a837a]">Status:</dt>
            <dd>
              <span
                className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(detail.paymentStatus)}`}
              >
                {formatOrderStatusLabel(detail.paymentStatus)}
              </span>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

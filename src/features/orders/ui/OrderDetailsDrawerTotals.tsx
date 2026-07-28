import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { formatOrderDrawerMoney } from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerTotalsProps = {
  detail: AdminOrderDetailView;
};

export function OrderDetailsDrawerTotals({
  detail,
}: OrderDetailsDrawerTotalsProps) {
  const shippingLabel = detail.isPickup
    ? "Free (Store Pickup)"
    : formatOrderDrawerMoney(detail.deliveryAmount, detail.baseCurrency);

  const discountLabel =
    detail.discountAmount > 0
      ? `−${formatOrderDrawerMoney(detail.discountAmount, detail.baseCurrency)}`
      : formatOrderDrawerMoney(0, detail.baseCurrency);

  return (
    <div className="rounded-2xl border border-[#ead7bf] px-5 py-4">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[#5c564e]">Subtotal</span>
          <span className="font-medium text-[#1f1a17]">
            {formatOrderDrawerMoney(detail.subtotalAmount, detail.baseCurrency)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-[#5c564e]">
            Delivery
            {!detail.isPickup && detail.deliveryLabel
              ? ` (${detail.deliveryLabel})`
              : ""}
          </span>
          <span className="font-medium text-[#1f1a17]">{shippingLabel}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-[#5c564e]">
            Coupon discount
            {detail.couponCode ? ` (${detail.couponCode})` : ""}
          </span>
          <span
            className={`font-medium ${
              detail.discountAmount > 0 ? "text-green-700" : "text-[#1f1a17]"
            }`}
          >
            {discountLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#ead7bf]/80 pt-3">
          <span className="text-base font-semibold text-[#1f1a17]">Total</span>
          <span className="text-base font-semibold text-[#1f1a17]">
            {formatOrderDrawerMoney(detail.totalAmount, detail.baseCurrency)}
          </span>
        </div>
      </div>
    </div>
  );
}

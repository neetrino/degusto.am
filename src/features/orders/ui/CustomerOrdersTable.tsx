"use client";

import { Card } from "@/components/ui/Card";
import {
  ADMIN_BADGE,
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_FOOTER_ROUNDED_B,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import {
  formatOrderDrawerMoney,
  formatOrderStatusLabel,
} from "@/features/orders/ui/order-drawer-format";
import { OrderPlacedAtCell } from "@/features/orders/ui/OrderPlacedAtCell";

type CustomerOrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  baseCurrency: string;
  placedAt: string | Date;
};

type CustomerOrdersTableProps = {
  orders: CustomerOrderRow[];
  onOpenOrder: (orderNumber: string) => void;
};

export function CustomerOrdersTable({
  orders,
  onOpenOrder,
}: CustomerOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Card className="border-brand/15 shadow-[0_14px_32px_-28px_rgba(28,25,23,0.5)]">
        <p className="px-4 py-8 text-center text-sm text-product-ink/60">
          No orders match these filters.
        </p>
      </Card>
    );
  }

  return (
    <Card
      className={`${ADMIN_TABLE_CARD} border-brand/15 shadow-[0_14px_32px_-28px_rgba(28,25,23,0.5)]`}
    >
      <div className="space-y-3 p-3 sm:hidden">
        {orders.map((order) => (
          <button
            key={order.id}
            type="button"
            onClick={() => onOpenOrder(order.orderNumber)}
            className="flex w-full flex-col gap-2 rounded-2xl border border-brand/15 bg-white p-3 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-product-ink">{order.orderNumber}</span>
              <span className="text-sm font-black text-product-ink">
                {formatOrderDrawerMoney(order.totalAmount, order.baseCurrency)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`${ADMIN_BADGE} ${orderStatusBadgeClass(order.status)}`}
              >
                {formatOrderStatusLabel(order.status)}
              </span>
              <span
                className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.paymentStatus)}`}
              >
                {formatOrderStatusLabel(order.paymentStatus)}
              </span>
            </div>
            <OrderPlacedAtCell value={order.placedAt} />
          </button>
        ))}
      </div>
      <div className={`${ADMIN_TABLE_OUTER_SCROLL} hidden sm:block`}>
        <table className={ADMIN_TABLE}>
          <thead className={ADMIN_TABLE_THEAD}>
            <tr>
              <th className={ADMIN_TABLE_TH}>Order</th>
              <th className={ADMIN_TABLE_TH}>Status</th>
              <th className={ADMIN_TABLE_TH}>Payment</th>
              <th className={ADMIN_TABLE_TH}>Total</th>
              <th className={ADMIN_TABLE_TH}>Placed</th>
            </tr>
          </thead>
          <tbody className={ADMIN_TABLE_TBODY}>
            {orders.map((order) => (
              <tr
                key={order.id}
                className={`${ADMIN_TABLE_ROW} cursor-pointer`}
                onClick={() => onOpenOrder(order.orderNumber)}
              >
                <td className={ADMIN_TABLE_TD}>
                  <span className="font-medium text-gray-900">{order.orderNumber}</span>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <span
                    className={`${ADMIN_BADGE} ${orderStatusBadgeClass(order.status)}`}
                  >
                    {formatOrderStatusLabel(order.status)}
                  </span>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <span
                    className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.paymentStatus)}`}
                  >
                    {formatOrderStatusLabel(order.paymentStatus)}
                  </span>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <span className="font-medium text-gray-900">
                    {formatOrderDrawerMoney(
                      order.totalAmount,
                      order.baseCurrency,
                    )}
                  </span>
                </td>
                <td className={ADMIN_TABLE_TD}>
                  <OrderPlacedAtCell value={order.placedAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={ADMIN_TABLE_FOOTER_ROUNDED_B}>
        <p className="text-sm text-gray-600">
          {orders.length} order{orders.length === 1 ? "" : "s"} on this page
        </p>
      </div>
    </Card>
  );
}

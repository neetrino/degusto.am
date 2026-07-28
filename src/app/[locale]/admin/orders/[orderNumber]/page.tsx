import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_SECTION_TITLE,
  ADMIN_LINK_BACK,
} from "@/features/admin/ui/admin-form-classes";
import {
  ADMIN_TABLE,
  ADMIN_TABLE_CARD,
  ADMIN_TABLE_OUTER_SCROLL,
  ADMIN_TABLE_ROW,
  ADMIN_TABLE_TBODY,
  ADMIN_TABLE_TD,
  ADMIN_TABLE_TH,
  ADMIN_TABLE_THEAD,
} from "@/features/admin/ui/admin-table-classes";
import {
  ADMIN_BADGE,
  orderStatusBadgeClass,
  paymentStatusBadgeClass,
} from "@/features/admin/ui/status-badge";
import { getAdminOrderByNumber } from "@/features/orders/application/queries";
import { isLocale } from "@/lib/i18n/config";

type AdminOrderDetailPageProps = {
  params: Promise<{ locale: string; orderNumber: string }>;
};

function formatMoney(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { locale, orderNumber } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const detail = await getAdminOrderByNumber(decodeURIComponent(orderNumber));
  if (!detail) {
    notFound();
  }

  const { order, items, events } = detail;
  const address = order.shippingAddress;

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`mb-1 ${ADMIN_PAGE_SUBTITLE}`}>
            <Link
              href={`/${locale}/admin/orders`}
              className={ADMIN_LINK_BACK}
            >
              Orders
            </Link>
          </p>
          <h1 className={ADMIN_PAGE_TITLE}>{order.orderNumber}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`${ADMIN_BADGE} ${orderStatusBadgeClass(order.status)}`}
            >
              {order.status}
            </span>
            <span
              className={`${ADMIN_BADGE} ${paymentStatusBadgeClass(order.paymentStatus)}`}
            >
              {order.paymentStatus}
            </span>
            {order.isArchived ? (
              <span className={`${ADMIN_BADGE} bg-[#e8e2d9] text-[#5c564e]`}>
                Archived
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className={`mb-3 ${ADMIN_SECTION_TITLE}`}>Customer</h2>
          <p className="text-sm font-medium text-[#1f1a17]">{order.contactName}</p>
          <p className="text-sm text-[#5c564e]">{order.contactEmail}</p>
          <p className="text-sm text-[#5c564e]">{order.contactPhone}</p>
          <p className="mt-3 text-sm text-[#5c564e]">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}
            {address.region ? `, ${address.region}` : ""}
            <br />
            {address.countryCode}
            {address.postalCode ? ` ${address.postalCode}` : ""}
          </p>
        </Card>

        <Card className="p-6">
          <h2 className={`mb-3 ${ADMIN_SECTION_TITLE}`}>Totals</h2>
          <p className="text-sm text-[#5c564e]">
            Subtotal: {formatMoney(order.subtotalAmount, order.baseCurrency)}
          </p>
          <p className="text-sm text-[#5c564e]">
            Delivery
            {order.deliveryLabelSnapshot
              ? ` (${order.deliveryLabelSnapshot})`
              : ""}
            : {formatMoney(order.deliveryAmount, order.baseCurrency)}
          </p>
          <p className="text-sm text-[#5c564e]">
            Coupon discount
            {order.promotionCodeSnapshot
              ? ` (${order.promotionCodeSnapshot})`
              : ""}
            : {formatMoney(order.discountAmount, order.baseCurrency)}
          </p>
          <p className="mt-2 text-sm font-semibold text-[#1f1a17]">
            Total: {formatMoney(order.totalAmount, order.baseCurrency)}
          </p>
          <p className="mt-2 text-sm text-[#8a837a]">
            Placed{" "}
            {order.placedAt.toISOString().slice(0, 16).replace("T", " ")} UTC
          </p>
        </Card>
      </div>

      <Card className={`mb-6 ${ADMIN_TABLE_CARD}`}>
        <div className="border-b border-[#ead7bf] px-4 py-3 sm:px-5">
          <h2 className={ADMIN_SECTION_TITLE}>Line items</h2>
        </div>
        <div className={ADMIN_TABLE_OUTER_SCROLL}>
          <table className={ADMIN_TABLE}>
            <thead className={ADMIN_TABLE_THEAD}>
              <tr>
                <th className={ADMIN_TABLE_TH}>Product</th>
                <th className={ADMIN_TABLE_TH}>Qty</th>
                <th className={ADMIN_TABLE_TH}>Line total</th>
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_TBODY}>
              {items.map((item) => (
                <tr key={item.id} className={ADMIN_TABLE_ROW}>
                  <td className={ADMIN_TABLE_TD}>
                    <p className="font-medium text-[#1f1a17]">
                      {item.productTitleSnapshot}
                    </p>
                    <p className="text-xs text-[#8a837a]">
                      {item.productSkuSnapshot}
                    </p>
                  </td>
                  <td className={ADMIN_TABLE_TD}>×{item.quantity}</td>
                  <td className={ADMIN_TABLE_TD}>
                    {formatMoney(item.lineTotalAmount, item.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className={`mb-4 ${ADMIN_SECTION_TITLE}`}>History</h2>
        <ol className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-lg border border-[#ead7bf] p-3 text-sm"
            >
              <p className="font-medium text-[#1f1a17]">
                {event.eventType}
                {event.fromState || event.toState
                  ? ` · ${event.fromState ?? "—"} → ${event.toState ?? "—"}`
                  : null}
              </p>
              <p className="text-[#8a837a]">
                {event.createdAt.toISOString().slice(0, 19).replace("T", " ")}{" "}
                UTC
                {event.isCustomerVisible ? " · customer-visible" : " · internal"}
              </p>
              {event.payload &&
              typeof event.payload === "object" &&
              "note" in event.payload &&
              typeof event.payload.note === "string" ? (
                <p className="mt-1 text-[#5c564e]">{event.payload.note}</p>
              ) : null}
            </li>
          ))}
          {events.length === 0 ? (
            <li className="text-sm text-[#5c564e]">No events yet.</li>
          ) : null}
        </ol>
      </Card>
    </section>
  );
}

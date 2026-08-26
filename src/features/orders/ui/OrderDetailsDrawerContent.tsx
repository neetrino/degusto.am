import type { ReactNode } from "react";
import { MapPin } from "lucide-react";

import type { AdminOrderDetailView } from "@/features/orders/application/order-detail-view";
import { AdminInlineStatusSelect } from "@/features/orders/ui/AdminInlineStatusSelect";
import { getOrderDrawerCopy } from "@/features/orders/ui/order-drawer-copy";
import {
  formatOrderDrawerMoney,
  formatOrderPlacedDate,
} from "@/features/orders/ui/order-drawer-format";

type OrderDetailsDrawerContentProps = {
  locale: string;
  detail: AdminOrderDetailView;
  onStatusChanged?: () => void;
};

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius)] border border-[#ece7df] bg-white px-4 py-4 shadow-[0_2px_12px_rgba(31,26,23,0.04)]">
      <h3 className="mb-3 font-display text-sm font-black tracking-wide text-brand">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
      <span className="text-[#8a837a]">{label}:</span>
      <span className="font-medium text-[#1f1a17]">{value}</span>
    </div>
  );
}

/** Order detail sections for the admin/customer side sheet. */
export function OrderDetailsDrawerContent({
  locale,
  detail,
  onStatusChanged,
}: OrderDetailsDrawerContentProps) {
  const copy = getOrderDrawerCopy(locale);
  const shippingLabel = detail.isPickup
    ? detail.storeName
    : formatOrderDrawerMoney(detail.deliveryAmount, detail.baseCurrency);

  return (
    <div className="space-y-4">
      <DrawerSection title={copy.orderStatus}>
        <div className="flex flex-wrap gap-2">
          <AdminInlineStatusSelect
            locale={locale}
            orderNumber={detail.orderNumber}
            kind="order"
            value={detail.status}
            onChanged={onStatusChanged}
          />
          <AdminInlineStatusSelect
            locale={locale}
            orderNumber={detail.orderNumber}
            kind="payment"
            value={detail.paymentStatus}
            onChanged={onStatusChanged}
          />
        </div>
        <p className="mt-3 text-sm text-[#5c564e]">
          {detail.paymentMethod} ·{" "}
          <span className="font-semibold text-[#1f1a17]">
            {formatOrderDrawerMoney(detail.totalAmount, detail.baseCurrency)}
          </span>
        </p>
      </DrawerSection>

      <DrawerSection title={copy.orderProducts}>
        <ul className="space-y-4">
          {detail.items.map((item) => (
            <li key={item.id}>
              <p className="text-sm font-semibold text-[#1f1a17]">{item.title}</p>
              <p className="mt-1 text-sm text-[#8a837a]">
                {copy.quantity}: {item.quantity} ×{" "}
                {formatOrderDrawerMoney(item.unitPriceAmount, item.currency)} ={" "}
                <span className="font-medium text-[#1f1a17]">
                  {formatOrderDrawerMoney(item.lineTotalAmount, item.currency)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </DrawerSection>

      <DrawerSection title={copy.orderSummary}>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#8a837a]">{copy.subtotal}</span>
            <span className="font-medium text-[#1f1a17]">
              {formatOrderDrawerMoney(detail.subtotalAmount, detail.baseCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#8a837a]">
              {copy.delivery}
              {!detail.isPickup && detail.deliveryLabel
                ? ` (${detail.deliveryLabel})`
                : ""}
            </span>
            <span className="font-medium text-[#1f1a17]">{shippingLabel}</span>
          </div>
          {detail.discountAmount > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#8a837a]">
                Discount
                {detail.couponCode ? ` (${detail.couponCode})` : ""}
              </span>
              <span className="font-medium text-[#3e573d]">
                −
                {formatOrderDrawerMoney(
                  detail.discountAmount,
                  detail.baseCurrency,
                )}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 border-t border-[#ece7df] pt-3">
            <span className="font-display text-base font-black text-[#1f1a17]">
              {copy.total}
            </span>
            <span className="font-display text-base font-black text-[#1f1a17]">
              {formatOrderDrawerMoney(detail.totalAmount, detail.baseCurrency)}
            </span>
          </div>
        </div>
      </DrawerSection>

      <DrawerSection title={copy.deliveryMethod}>
        <DetailField label={copy.method} value={detail.shippingMethod} />
      </DrawerSection>

      <DrawerSection title={copy.deliveryAddress}>
        <div className="flex items-start gap-2 text-sm">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-brand"
            aria-hidden
          />
          <div>
            <p className="font-medium text-[#1f1a17]">{detail.addressLine}</p>
            {detail.addressHint ? (
              <p className="mt-1 text-xs text-[#8a837a]">{detail.addressHint}</p>
            ) : null}
          </div>
        </div>
      </DrawerSection>

      <DrawerSection title={copy.payment}>
        <div className="space-y-2">
          <DetailField label={copy.method} value={detail.paymentMethod} />
          <DetailField
            label={copy.amount}
            value={formatOrderDrawerMoney(
              detail.paymentAmount,
              detail.baseCurrency,
            )}
          />
        </div>
      </DrawerSection>

      <DrawerSection title={copy.customer}>
        <div className="space-y-2">
          <DetailField label={copy.name} value={detail.contactName} />
          <DetailField label={copy.phone} value={detail.contactPhone} />
          <DetailField label={copy.email} value={detail.contactEmail} />
        </div>
      </DrawerSection>
    </div>
  );
}

export function formatOrderDrawerHeaderTitle(
  locale: string,
  orderNumber: string,
): string {
  const copy = getOrderDrawerCopy(locale);
  return `${copy.order} #${orderNumber}`;
}

export function formatOrderDrawerHeaderSubtitle(
  locale: string,
  placedAt: string,
): string {
  const copy = getOrderDrawerCopy(locale);
  return `${copy.orderedOn} ${formatOrderPlacedDate(placedAt, locale)}`;
}

export function getOrderDrawerLoadingLabel(locale: string): string {
  return getOrderDrawerCopy(locale).loading;
}

export function getOrderDrawerAriaLabel(locale: string): string {
  return getOrderDrawerCopy(locale).ariaLabel;
}

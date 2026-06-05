'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsAddressesProps {
  orderDetails: OrderDetails;
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="shrink-0 font-medium text-[#1d392b]">{label}</span>
      <span className="min-w-0 text-gray-700">{value}</span>
    </div>
  );
}

function buildShippingAddressLine(orderDetails: OrderDetails): string | null {
  const address = orderDetails.shippingAddress;
  if (!address) {
    return null;
  }

  const line1 = address.address || address.addressLine1;
  if (!line1?.trim()) {
    return null;
  }

  return address.addressLine2?.trim() ? `${line1}, ${address.addressLine2}` : line1;
}

function resolveShippingMethodLabel(
  shippingMethod: string | null | undefined,
  t: (key: string) => string
): string | null {
  if (!shippingMethod) {
    return null;
  }

  if (shippingMethod === 'pickup') {
    return t('admin.orders.orderDetails.pickup');
  }

  if (shippingMethod === 'delivery') {
    return t('checkout.shipping.delivery');
  }

  return shippingMethod;
}

export function OrderDetailsAddresses({ orderDetails }: OrderDetailsAddressesProps) {
  const { t } = useTranslation();

  const shippingMethodLabel = resolveShippingMethodLabel(orderDetails.shippingMethod, t);
  const shippingAddressLine = buildShippingAddressLine(orderDetails);
  const shippingCity = orderDetails.shippingAddress?.city?.trim() || null;
  const shippingPhone =
    orderDetails.shippingAddress?.phone?.trim() ||
    orderDetails.shippingAddress?.shippingPhone?.trim() ||
    null;

  const shippingDetails = [
    {
      key: 'shippingMethod',
      label: t('admin.orders.orderDetails.shippingMethod'),
      value: shippingMethodLabel,
    },
    { key: 'address', label: `${t('checkout.form.address')}:`, value: shippingAddressLine },
    { key: 'city', label: `${t('checkout.form.city')}:`, value: shippingCity },
    { key: 'phone', label: `${t('checkout.form.phoneNumber')}:`, value: shippingPhone },
  ].filter((row): row is { key: string; label: string; value: string } => Boolean(row.value?.trim()));

  if (shippingDetails.length === 0) {
    return null;
  }

  return (
    <section className="h-full rounded-2xl border border-[#e2e8e3] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
      <h3 className="mb-3 text-sm font-semibold text-[#1d392b]">
        {t('admin.orders.orderDetails.shippingAddress')}
      </h3>
      <div className="space-y-2">
        {shippingDetails.map((row) => (
          <DetailRow key={row.key} label={row.label} value={row.value} />
        ))}
      </div>
    </section>
  );
}

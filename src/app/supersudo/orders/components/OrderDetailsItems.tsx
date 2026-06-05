'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { CurrencyCode } from '../../../../lib/currency';
import { processImageUrl } from '../../../../lib/utils/image-utils';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsItemsProps {
  orderDetails: OrderDetails;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
  embedded?: boolean;
}

type OrderItem = OrderDetails['items'][number];

function formatItemDetails(item: OrderItem): string {
  const labels = (item.variantOptions ?? [])
    .map((opt) => opt.label || opt.value)
    .filter((label): label is string => Boolean(label));

  return labels.length > 0 ? labels.join(' | ') : '—';
}

export function OrderDetailsItems({
  orderDetails,
  formatCurrency,
  embedded = false,
}: OrderDetailsItemsProps) {
  const { t } = useTranslation();

  const sectionClass = embedded
    ? 'p-4 sm:p-5'
    : 'rounded-2xl border border-[#e2e8e3] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]';

  if (!Array.isArray(orderDetails.items) || orderDetails.items.length === 0) {
    return (
      <section className={sectionClass}>
        <h3 className="mb-3 text-sm font-semibold text-[#1d392b]">{t('admin.orders.orderDetails.items')}</h3>
        <div className="text-sm text-gray-500">{t('admin.orders.orderDetails.noItemsFound')}</div>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <h3 className="mb-3 text-sm font-semibold text-[#1d392b]">{t('admin.orders.orderDetails.items')}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#edf1ee] text-left text-xs font-semibold uppercase tracking-wide text-[#6a7e71]">
              <th className="w-16 px-3 py-2.5">{t('admin.orders.orderDetails.image')}</th>
              <th className="min-w-[8rem] px-3 py-2.5">{t('admin.orders.orderDetails.product')}</th>
              <th className="min-w-[12rem] px-3 py-2.5">{t('admin.orders.orderDetails.colorSize')}</th>
              <th className="w-20 px-3 py-2.5 text-right">{t('admin.orders.orderDetails.qty')}</th>
              <th className="w-28 px-3 py-2.5 text-right">{t('admin.orders.orderDetails.price')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf1ee]">
            {orderDetails.items.map((item) => {
              const imageSrc = item.imageUrl ? processImageUrl(item.imageUrl) : null;

              return (
                <tr key={item.id} className="text-[#293a30]">
                  <td className="px-3 py-3 align-middle">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={item.productTitle}
                        className="h-10 w-10 rounded-md border border-[#e2e8e3] object-cover"
                        onError={(event) => {
                          (event.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md border border-[#e2e8e3] bg-[#f7faf7]" aria-hidden />
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle font-medium">{item.productTitle}</td>
                  <td className="px-3 py-3 align-middle text-[#5b6f63]">{formatItemDetails(item)}</td>
                  <td className="px-3 py-3 align-middle text-right tabular-nums">{item.quantity}</td>
                  <td className="px-3 py-3 align-middle text-right tabular-nums font-medium">
                    {formatCurrency(item.unitPrice, orderDetails.currency || 'AMD', 'USD')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import Link from 'next/link';
import { Button, Card } from '@shop/ui';
import { formatPriceInCurrency, convertPrice, type CurrencyCode } from '../../lib/currency';
import { getStatusColor, getPaymentStatusColor } from './utils';
import { formatOrderStatusLabel } from '../../lib/order-status-labels';
import { formatHydrationSafeDate } from '../../lib/format-date';
import type { OrderListItem } from './types';

interface ProfileOrdersProps {
  orders: OrderListItem[];
  ordersLoading: boolean;
  ordersPage: number;
  setOrdersPage: (page: number | ((prev: number) => number)) => void;
  ordersMeta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  currency: CurrencyCode;
  onOrderClick: (orderNumber: string, e: React.MouseEvent<HTMLAnchorElement>) => void;
  t: (key: string) => string;
}

function orderRowTotal(order: OrderListItem, currency: CurrencyCode): string {
  if (order.subtotal !== undefined && order.discountAmount !== undefined && order.taxAmount !== undefined) {
    const subtotalAMD = convertPrice(order.subtotal, 'USD', 'AMD');
    const discountAMD = convertPrice(order.discountAmount, 'USD', 'AMD');
    const taxAMD = convertPrice(order.taxAmount, 'USD', 'AMD');
    const totalWithoutShippingAMD = subtotalAMD - discountAMD + taxAMD;
    const totalDisplay = currency === 'AMD' ? totalWithoutShippingAMD : convertPrice(totalWithoutShippingAMD, 'AMD', currency);
    return formatPriceInCurrency(totalDisplay, currency);
  }
  const totalAMD = convertPrice(order.total, 'USD', 'AMD');
  const shippingAMD = order.shippingAmount || 0;
  const totalWithoutShippingAMD = totalAMD - shippingAMD;
  const totalDisplay = currency === 'AMD' ? totalWithoutShippingAMD : convertPrice(totalWithoutShippingAMD, 'AMD', currency);
  return formatPriceInCurrency(totalDisplay, currency);
}

export function ProfileOrders({
  orders,
  ordersLoading,
  ordersPage,
  setOrdersPage,
  ordersMeta,
  currency,
  onOrderClick,
  t,
}: ProfileOrdersProps) {
  const titleClass = 'text-lg font-bold tracking-tight text-gray-900 sm:text-xl';

  if (ordersLoading) {
    return (
      <Card className="rounded-2xl border border-[#F66812]/20 p-5 shadow-none sm:p-7 lg:p-8">
        <h2 className={`${titleClass} mb-6 sm:mb-8`}>{t('profile.orders.title')}</h2>
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-[#F66812]/10 sm:h-32" />
          ))}
        </div>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="rounded-2xl border border-[#F66812]/20 p-5 shadow-none sm:p-7 lg:p-8">
        <h2 className={`${titleClass} mb-6 sm:mb-8`}>{t('profile.orders.title')}</h2>
        <div className="flex flex-col items-center gap-5 py-12 sm:py-16">
          <p className="max-w-sm text-center text-sm text-gray-600">{t('profile.orders.noOrders')}</p>
          <Link href="/shop">
            <Button variant="primary" className="!bg-[#F66812] hover:!bg-[#e45f10] focus:!ring-[#F66812]">
              {t('profile.dashboard.startShopping')}
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-[#F66812]/20 p-5 shadow-none sm:p-7 lg:p-8">
      <h2 className={`${titleClass} mb-6 sm:mb-8`}>{t('profile.orders.title')}</h2>
      <ul className="space-y-3 sm:space-y-4">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.number}`}
              onClick={(e) => onOrderClick(order.number, e)}
              className="block rounded-2xl border border-[#F66812]/20 bg-[#F66812]/[0.04] p-4 transition hover:border-[#F66812]/35 hover:bg-white sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                <div className="min-w-0 flex-1 space-y-3">
                  <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                    {t('profile.orders.orderNumber')}
                    {order.number}
                  </h3>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-2">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {t('profile.dashboard.orderStatus')}
                      </p>
                      <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                        {formatOrderStatusLabel(t, order.status, 'order')}
                      </span>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {t('profile.dashboard.paymentStatus')}
                      </p>
                      <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {formatOrderStatusLabel(t, order.paymentStatus, 'payment')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 sm:text-sm">
                    {order.itemsCount} {order.itemsCount !== 1 ? t('profile.orders.items') : t('profile.orders.item')} • {t('profile.dashboard.placedOn')}{' '}
                    {formatHydrationSafeDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-row items-end justify-between gap-3 border-t border-[#F66812]/15 pt-3 sm:items-center lg:flex-col lg:items-end lg:border-0 lg:pt-0">
                  <div className="text-left lg:text-right">
                    <p className="text-lg font-bold text-gray-900 sm:text-xl">{orderRowTotal(order, currency)}</p>
                    <p className="mt-0.5 text-xs text-[#F66812]">{t('profile.dashboard.viewDetails')}</p>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {ordersMeta && ordersMeta.totalPages > 1 && (
        <div className="mt-8 flex flex-col gap-4 border-t border-[#F66812]/15 pt-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <p className="text-center text-xs text-gray-600 sm:text-left sm:text-sm">
            {t('profile.orders.page')} {ordersMeta.page} {t('profile.orders.of')} {ordersMeta.totalPages} • {ordersMeta.total} {t('profile.orders.totalOrders')}
          </p>
          <div className="flex justify-center gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="min-w-[100px] rounded-xl border-[#F66812]/40 text-[#F66812] hover:border-[#F66812] hover:bg-[#F66812]/10"
              onClick={() => setOrdersPage((prev) => Math.max(1, prev - 1))}
              disabled={ordersPage === 1 || ordersLoading}
            >
              {t('profile.orders.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[100px] rounded-xl border-[#F66812]/40 text-[#F66812] hover:border-[#F66812] hover:bg-[#F66812]/10"
              onClick={() => setOrdersPage((prev) => Math.min(ordersMeta.totalPages, prev + 1))}
              disabled={ordersPage === ordersMeta.totalPages || ordersLoading}
            >
              {t('profile.orders.next')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import { CurrencyCode } from '../../../../lib/currency';
import { OrderDetailsTopSummary } from './OrderDetailsTopSummary';
import { OrderDetailsSummary } from './OrderDetailsSummary';
import { OrderDetailsAddresses } from './OrderDetailsAddresses';
import { OrderDetailsTotals } from './OrderDetailsTotals';
import { OrderDetailsItems } from './OrderDetailsItems';
import { formatHydrationSafeDateTime } from '@/lib/format-date';
import type { OrderDetails } from '../useOrders';
import { formatOrderNumber } from '@/lib/orders/format-order-number';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface OrderDetailsModalProps {
  open: boolean;
  orderDetails: OrderDetails | null;
  loading: boolean;
  currency: string;
  onClose: () => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsModal({
  open,
  orderDetails,
  loading,
  currency,
  onClose,
  formatCurrency,
}: OrderDetailsModalProps) {
  const { t } = useTranslation();
  const [isPanelVisible, setIsPanelVisible] = useState(false);

  useBodyScrollLock(open);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setIsPanelVisible(true));
      return;
    }
    setIsPanelVisible(false);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const createdAtLabel = orderDetails?.createdAt
    ? formatHydrationSafeDateTime(orderDetails.createdAt)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className={`absolute inset-0 bg-[#1d392b]/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isPanelVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label={t('admin.common.close')}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-sheet-title"
        aria-busy={loading}
        className={`relative flex h-full w-full max-w-3xl flex-col border-l border-[#dde4de] bg-[#f7faf7] shadow-[-12px_0_40px_rgba(31,54,41,0.14)] transition-transform duration-300 ease-out lg:max-w-4xl ${
          isPanelVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="shrink-0 border-b border-[#dde4de] bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#60766a]">
                {t('admin.orders.orderDetails.title')}
              </p>
              <h2
                id="order-details-sheet-title"
                className="mt-1 truncate text-xl font-bold text-[#1d392b]"
              >
                {orderDetails ? formatOrderNumber(orderDetails.number) : '…'}
              </h2>
              {createdAtLabel ? (
                <p className="mt-1 text-xs text-[#6a7e71]">
                  {t('admin.orders.orderDetails.createdAt')}: {createdAtLabel}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d7dfd8] bg-[#f7faf7] text-[#60766a] transition-colors hover:bg-[#eff4ef] hover:text-[#1d392b]"
              aria-label={t('admin.common.close')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#dde4de] border-b-[#1f6c4b]" />
              <p className="text-sm text-[#60766a]">{t('admin.orders.orderDetails.loadingOrderDetails')}</p>
            </div>
          ) : orderDetails ? (
            <div className="space-y-4">
              <OrderDetailsTopSummary orderDetails={orderDetails} currency={currency} />

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <OrderDetailsAddresses orderDetails={orderDetails} />
                <OrderDetailsSummary orderDetails={orderDetails} />
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#e2e8e3] bg-white shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
                <OrderDetailsItems
                  orderDetails={orderDetails}
                  formatCurrency={formatCurrency}
                  embedded
                />
                <OrderDetailsTotals
                  orderDetails={orderDetails}
                  currency={currency}
                  formatCurrency={formatCurrency}
                />
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import { CurrencyCode } from '../../../../lib/currency';
import { OrderDetailsSummary } from './OrderDetailsSummary';
import { OrderDetailsAddresses } from './OrderDetailsAddresses';
import { OrderDetailsTotals } from './OrderDetailsTotals';
import { OrderDetailsItems } from './OrderDetailsItems';
import type { OrderDetails } from '../useOrders';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface OrderDetailsModalProps {
  orderDetails: OrderDetails | null;
  loading: boolean;
  currency: string;
  onClose: () => void;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsModal({
  orderDetails,
  loading,
  currency,
  onClose,
  formatCurrency,
}: OrderDetailsModalProps) {
  const { t } = useTranslation();
  useBodyScrollLock(Boolean(orderDetails));

  if (!orderDetails) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-h-[90vh] sm:max-w-6xl sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 sm:text-2xl">
            {t('admin.orders.orderDetails.title')} #{orderDetails.number}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={t('admin.common.close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('admin.orders.orderDetails.loadingOrderDetails')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <OrderDetailsSummary
                orderDetails={orderDetails}
                currency={currency}
                formatCurrency={formatCurrency}
              />
              <OrderDetailsAddresses
                orderDetails={orderDetails}
                formatCurrency={formatCurrency}
              />
              <OrderDetailsTotals
                orderDetails={orderDetails}
                currency={currency}
                formatCurrency={formatCurrency}
              />
              <OrderDetailsItems
                orderDetails={orderDetails}
                formatCurrency={formatCurrency}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


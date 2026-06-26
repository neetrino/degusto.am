'use client';

import { useTranslation } from '../../lib/i18n-client';
import { useOrders } from '../supersudo/orders/useOrders';
import { OrderDetailsModal } from '../supersudo/orders/components/OrderDetailsModal';
import { AdminMobileOrderCard } from './components/AdminMobileOrderCard';
import { AdminMobileOrdersFilters } from './components/AdminMobileOrdersFilters';
import { AdminMobilePagination } from './components/AdminMobilePagination';
import { ADMIN_MOBILE_CARD_CLASS } from './components/admin-mobile-ui';

export function AdminMobileOrdersContent() {
  const { t } = useTranslation();
  const {
    orders,
    loading,
    currency,
    statusFilter,
    paymentStatusFilter,
    searchQuery,
    page,
    meta,
    updatingStatuses,
    updatingPaymentStatuses,
    updateMessage,
    selectedOrderId,
    orderDetails,
    loadingOrderDetails,
    setPage,
    formatCurrency,
    handleViewOrderDetails,
    handleCloseModal,
    handleStatusChange,
    handlePaymentStatusChange,
    router,
    searchParams,
  } = useOrders();

  return (
    <div className="pb-2">
      <AdminMobileOrdersFilters
        statusFilter={statusFilter}
        paymentStatusFilter={paymentStatusFilter}
        searchQuery={searchQuery}
        totalCount={meta?.total ?? orders.length}
        updateMessage={updateMessage}
        router={router}
        searchParams={searchParams}
      />

      {loading ? (
        <div className={`${ADMIN_MOBILE_CARD_CLASS} py-10 text-center`}>
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-[#f66812]" />
          <p className="text-sm text-gray-600">{t('admin.orders.loadingOrders')}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className={`${ADMIN_MOBILE_CARD_CLASS} py-8 text-center text-sm text-gray-600`}>
          {t('admin.orders.noOrders')}
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <AdminMobileOrderCard
                order={order}
                updatingStatus={updatingStatuses.has(order.id)}
                updatingPaymentStatus={updatingPaymentStatuses.has(order.id)}
                onViewDetails={() => handleViewOrderDetails(order.id)}
                onStatusChange={(status) => handleStatusChange(order.id, status)}
                onPaymentStatusChange={(paymentStatus) => handlePaymentStatusChange(order.id, paymentStatus)}
                formatCurrency={formatCurrency}
              />
            </li>
          ))}
        </ul>
      )}

      {meta ? (
        <AdminMobilePagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          onPageChange={setPage}
        />
      ) : null}

      {selectedOrderId ? (
        <OrderDetailsModal
          open={Boolean(selectedOrderId)}
          orderDetails={orderDetails}
          loading={loadingOrderDetails}
          currency={currency}
          onClose={handleCloseModal}
          formatCurrency={formatCurrency}
        />
      ) : null}
    </div>
  );
}

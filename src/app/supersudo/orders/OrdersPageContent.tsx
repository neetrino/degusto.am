'use client';

import { useOrders } from './useOrders';
import { OrdersFilters } from './components/OrdersFilters';
import { BulkSelectionControls } from './components/BulkSelectionControls';
import { OrdersTable } from './components/OrdersTable';
import { OrderDetailsModal } from './components/OrderDetailsModal';

export function OrdersPageContent() {
  const {
    orders,
    loading,
    currency,
    statusFilter,
    paymentStatusFilter,
    searchQuery,
    page,
    meta,
    sortBy,
    sortOrder,
    updatingStatuses,
    updatingPaymentStatuses,
    updateMessage,
    selectedIds,
    bulkDeleting,
    selectedOrderId,
    orderDetails,
    loadingOrderDetails,
    setPage,
    formatCurrency,
    handleViewOrderDetails,
    handleCloseModal,
    toggleSelect,
    toggleSelectAll,
    handleSort,
    handleBulkDelete,
    handleStatusChange,
    handlePaymentStatusChange,
    router,
    searchParams,
  } = useOrders();

  return (
    <>
      <OrdersFilters
        statusFilter={statusFilter}
        paymentStatusFilter={paymentStatusFilter}
        searchQuery={searchQuery}
        totalCount={meta?.total ?? orders.length}
        updateMessage={updateMessage}
        setPage={setPage}
        router={router}
        searchParams={searchParams}
      />

      <BulkSelectionControls
        selectedCount={selectedIds.size}
        onBulkDelete={handleBulkDelete}
        bulkDeleting={bulkDeleting}
      />

      <OrdersTable
        orders={orders}
        loading={loading}
        selectedIds={selectedIds}
        updatingStatuses={updatingStatuses}
        updatingPaymentStatuses={updatingPaymentStatuses}
        sortBy={sortBy}
        sortOrder={sortOrder}
        page={page}
        meta={meta}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onSort={handleSort}
        onViewDetails={handleViewOrderDetails}
        onStatusChange={handleStatusChange}
        onPaymentStatusChange={handlePaymentStatusChange}
        onPageChange={(newPage) => setPage(newPage)}
        formatCurrency={formatCurrency}
      />

      {selectedOrderId && (
        <OrderDetailsModal
          orderDetails={orderDetails}
          loading={loadingOrderDetails}
          currency={currency}
          onClose={handleCloseModal}
          formatCurrency={formatCurrency}
        />
      )}
    </>
  );
}

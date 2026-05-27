'use client';

import { useMemo } from 'react';
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

  const summary = useMemo(() => {
    const safeOrders = orders ?? [];
    const totalAmount = safeOrders.reduce((sum, order) => sum + (order.total ?? 0), 0);
    const paidCount = safeOrders.filter((order) => order.paymentStatus === 'paid').length;
    const pendingCount = safeOrders.filter((order) => order.status === 'pending').length;
    const completedCount = safeOrders.filter((order) => order.status === 'completed').length;
    return {
      totalCount: meta?.total ?? safeOrders.length,
      totalAmount,
      paidCount,
      pendingCount,
      completedCount,
    };
  }, [meta?.total, orders]);

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-[#dde4de] bg-[#f7faf7] p-5 shadow-[0_12px_34px_rgba(31,54,41,0.08)] sm:p-6">
      <div className="absolute -bottom-16 -right-12 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(41,123,85,0.14)_0%,rgba(41,123,85,0)_70%)]" />
      <div className="relative z-10 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-semibold leading-none text-[#1d392b]">Պատվերների կառավարում <span className="text-[#7f9a63]">❧</span></h1>
        </div>
        <button
          type="button"
          className="rounded-xl border border-[#d7dfd8] bg-white px-4 py-2 text-sm font-semibold text-[#315544] shadow-sm transition-colors hover:bg-[#eff4ef]"
        >
          Արտահանել
        </button>
      </div>

      <div className="relative z-10 mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#e2e8e3] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
          <p className="text-sm font-semibold text-[#60766a]">Ընդհանուր պատվերներ</p>
          <p className="mt-1 text-4xl font-bold text-[#1f2f25]">{summary.totalCount}</p>
          <p className="mt-1 text-xs font-semibold text-[#6a7e71]">Ամսում</p>
        </div>
        <div className="rounded-2xl border border-[#e2e8e3] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
          <p className="text-sm font-semibold text-[#60766a]">Ընդհանուր գումար</p>
          <p className="mt-1 text-4xl font-bold text-[#1f2f25]">{formatCurrency(summary.totalAmount, currency)}</p>
          <p className="mt-1 text-xs font-semibold text-[#6a7e71]">Ամսում</p>
        </div>
        <div className="rounded-2xl border border-[#e2e8e3] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
          <p className="text-sm font-semibold text-[#60766a]">Կատարված</p>
          <p className="mt-1 text-4xl font-bold text-[#1f2f25]">{summary.completedCount}</p>
          <p className="mt-1 text-xs font-semibold text-[#6a7e71]">
            {summary.totalCount > 0 ? `${Math.round((summary.completedCount / summary.totalCount) * 100)}%` : '0%'}
          </p>
        </div>
        <div className="rounded-2xl border border-[#e2e8e3] bg-white p-4 shadow-[0_5px_14px_rgba(22,45,32,0.05)]">
          <p className="text-sm font-semibold text-[#60766a]">Սպասման մեջ</p>
          <p className="mt-1 text-4xl font-bold text-[#1f2f25]">{summary.pendingCount}</p>
          <p className="mt-1 text-xs font-semibold text-[#6a7e71]">
            {summary.totalCount > 0 ? `${Math.round((summary.pendingCount / summary.totalCount) * 100)}%` : '0%'}
          </p>
        </div>
      </div>

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
        paidCount={summary.paidCount}
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
    </div>
  );
}

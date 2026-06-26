'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../../lib/i18n-client';
import type { useOrders } from '../../supersudo/orders/useOrders';
import { resetOrdersPageParam } from '../../supersudo/orders/hooks/useAdminOrdersUrlState';
import { ADMIN_MOBILE_ORDERS_PATH } from '@/constants/admin-mobile-profile';
import { ADMIN_MOBILE_CARD_CLASS, ADMIN_MOBILE_FIELD_CLASS } from './admin-mobile-ui';

const SEARCH_DEBOUNCE_MS = 400;

type AdminMobileOrdersFiltersProps = {
  statusFilter: string;
  paymentStatusFilter: string;
  searchQuery: string;
  totalCount: number;
  updateMessage: { type: 'success' | 'error'; text: string } | null;
  router: ReturnType<typeof useOrders>['router'];
  searchParams: ReturnType<typeof useOrders>['searchParams'];
};

export function AdminMobileOrdersFilters({
  statusFilter,
  paymentStatusFilter,
  searchQuery,
  totalCount,
  updateMessage,
  router,
  searchParams,
}: AdminMobileOrdersFiltersProps) {
  const { t } = useTranslation();
  const [draftSearch, setDraftSearch] = useState(searchQuery);

  useEffect(() => {
    setDraftSearch(searchQuery);
  }, [searchQuery]);

  const pushParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      mutate(params);
      resetOrdersPageParam(params);
      const url = params.toString()
        ? `${ADMIN_MOBILE_ORDERS_PATH}?${params.toString()}`
        : ADMIN_MOBILE_ORDERS_PATH;
      router.push(url, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const trimmedDraft = draftSearch.trim();
    const trimmedQuery = searchQuery.trim();
    if (trimmedDraft === trimmedQuery) {
      return;
    }
    const timer = window.setTimeout(() => {
      pushParams((params) => {
        if (trimmedDraft) {
          params.set('search', trimmedDraft);
        } else {
          params.delete('search');
        }
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draftSearch, pushParams, searchQuery]);

  return (
    <section className={`${ADMIN_MOBILE_CARD_CLASS} mb-4 space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">{t('admin.orders.title')}</p>
        <span className="shrink-0 rounded-full bg-[#f66812]/10 px-2.5 py-0.5 text-xs font-semibold text-[#f66812]">
          {totalCount}
        </span>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-600">{t('common.buttons.search')}</label>
        <input
          type="search"
          enterKeyHint="search"
          placeholder={t('admin.orders.searchPlaceholder')}
          className={ADMIN_MOBILE_FIELD_CLASS}
          value={draftSearch}
          onChange={(event) => setDraftSearch(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{t('admin.orders.status')}</label>
          <select
            className={ADMIN_MOBILE_FIELD_CLASS}
            value={statusFilter}
            onChange={(event) => {
              pushParams((params) => {
                if (event.target.value) {
                  params.set('status', event.target.value);
                } else {
                  params.delete('status');
                }
              });
            }}
          >
            <option value="">{t('admin.orders.allStatuses')}</option>
            <option value="pending">{t('admin.orders.pending')}</option>
            <option value="processing">{t('admin.orders.processing')}</option>
            <option value="completed">{t('admin.orders.completed')}</option>
            <option value="cancelled">{t('admin.orders.cancelled')}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">{t('admin.orders.payment')}</label>
          <select
            className={ADMIN_MOBILE_FIELD_CLASS}
            value={paymentStatusFilter}
            onChange={(event) => {
              pushParams((params) => {
                if (event.target.value) {
                  params.set('paymentStatus', event.target.value);
                } else {
                  params.delete('paymentStatus');
                }
              });
            }}
          >
            <option value="">{t('admin.orders.allPaymentStatuses')}</option>
            <option value="paid">{t('admin.orders.paid')}</option>
            <option value="pending">{t('admin.orders.pendingPayment')}</option>
            <option value="failed">{t('admin.orders.failed')}</option>
          </select>
        </div>
      </div>

      {updateMessage ? (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            updateMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
          role="status"
        >
          {updateMessage.text}
        </p>
      ) : null}
    </section>
  );
}

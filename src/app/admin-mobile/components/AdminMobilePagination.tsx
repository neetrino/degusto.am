'use client';

import { useTranslation } from '../../../lib/i18n-client';

type AdminMobilePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
};

export function AdminMobilePagination({ page, totalPages, total, onPageChange }: AdminMobilePaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="sticky bottom-[100px] z-10 mt-4 rounded-2xl border border-gray-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-center text-xs text-gray-600">
        {t('admin.orders.showingPage')
          .replace('{page}', String(page))
          .replace('{totalPages}', String(totalPages))
          .replace('{total}', String(total))}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-800 disabled:opacity-40"
        >
          {t('admin.orders.previous')}
        </button>
        <span className="flex items-center justify-center px-2 text-sm font-bold text-[#f66812]">
          {page}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex-1 rounded-xl bg-[#f66812] py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t('admin.orders.next')}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import { Button } from '@shop/ui';

interface OrdersPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (newPage: number) => void;
}

export function OrdersPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: OrdersPaginationProps) {
  const { t } = useTranslation();
  const PAGE_CHUNK_SIZE = 3;

  const paginationWindow = useMemo(() => {
    if (totalPages <= 10) {
      return {
        start: 1,
        end: totalPages,
      };
    }

    const chunkIndex = Math.floor((page - 1) / PAGE_CHUNK_SIZE);
    const start = chunkIndex * PAGE_CHUNK_SIZE + 1;
    const end = Math.min(totalPages, start + PAGE_CHUNK_SIZE - 1);

    return { start, end };
  }, [page, totalPages]);

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    for (let currentPage = paginationWindow.start; currentPage <= paginationWindow.end; currentPage++) {
      pages.push(currentPage);
    }
    return pages;
  }, [paginationWindow]);

  const goToPage = (targetPage: number) => {
    onPageChange(Math.min(totalPages, Math.max(1, targetPage)));
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-gray-700">
        {t('admin.orders.showingPage')
          .replace('{page}', page.toString())
          .replace('{totalPages}', totalPages.toString())
          .replace('{total}', total.toString())}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {totalPages > 10 && (
          <Button
            variant="ghost"
            onClick={() => goToPage(paginationWindow.start - PAGE_CHUNK_SIZE)}
            disabled={paginationWindow.start <= 1}
          >
            -{PAGE_CHUNK_SIZE}
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
        >
          {t('admin.orders.previous')}
        </Button>
        {visiblePages.map((visiblePage) => (
          <Button
            key={visiblePage}
            variant={page === visiblePage ? 'primary' : 'ghost'}
            onClick={() => goToPage(visiblePage)}
          >
            {visiblePage}
          </Button>
        ))}
        <Button
          variant="ghost"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
        >
          {t('admin.orders.next')}
        </Button>
        {totalPages > 10 && (
          <Button
            variant="ghost"
            onClick={() => goToPage(paginationWindow.end + 1)}
            disabled={paginationWindow.end >= totalPages}
          >
            +{PAGE_CHUNK_SIZE}
          </Button>
        )}
      </div>
    </div>
  );
}


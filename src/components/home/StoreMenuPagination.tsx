'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { getCompactPaginationPages } from '../../lib/utils/compact-pagination-pages';

export type StoreMenuPaginationProps = {
  navAriaLabel: string;
  currentPage: number;
  totalPages: number;
  buildPageHref: (page: number) => string;
};

const PAGE_LINK_CLASS =
  'flex h-10 min-w-[2.5rem] items-center justify-center rounded-full border border-[#dedede] bg-white px-3 text-sm font-semibold text-[#3c2f2f] transition hover:border-[#ff7f20] hover:bg-[#fff5ed]';
const PAGE_CURRENT_CLASS =
  'flex h-10 min-w-[2.5rem] items-center justify-center rounded-full bg-[#ff7f20] px-3 text-sm font-bold text-white';
const EDGE_CLASS =
  'min-w-[5.5rem] rounded-full border border-[#dedede] bg-white px-4 py-2 text-center text-sm font-semibold text-[#3c2f2f] transition hover:border-[#ff7f20] hover:bg-[#fff5ed]';
const EDGE_DISABLED_CLASS =
  'min-w-[5.5rem] cursor-default rounded-full border border-[#e4e4e7] bg-[#fafafc] px-4 py-2 text-center text-sm font-medium text-[#a1a1aa]';

export function StoreMenuPagination({
  navAriaLabel,
  currentPage,
  totalPages,
  buildPageHref,
}: StoreMenuPaginationProps) {
  const { t } = useTranslation();
  const items = useMemo(
    () => getCompactPaginationPages(totalPages, currentPage),
    [totalPages, currentPage]
  );

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="mt-16 flex flex-wrap items-center justify-center gap-2" aria-label={navAriaLabel}>
      {currentPage > 1 ? (
        <Link href={buildPageHref(currentPage - 1)} className={EDGE_CLASS}>
          {t('common.pagination.previous')}
        </Link>
      ) : (
        <span className={EDGE_DISABLED_CLASS}>{t('common.pagination.previous')}</span>
      )}

      <div className="flex flex-wrap items-center justify-center gap-1">
        {items.map((item, idx) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-sm font-medium text-[#717182]" aria-hidden>
              …
            </span>
          ) : (
            <span key={item}>
              {item === currentPage ? (
                <span className={PAGE_CURRENT_CLASS} aria-current="page">
                  {item}
                </span>
              ) : (
                <Link href={buildPageHref(item)} className={PAGE_LINK_CLASS}>
                  {item}
                </Link>
              )}
            </span>
          )
        )}
      </div>

      {currentPage < totalPages ? (
        <Link href={buildPageHref(currentPage + 1)} className={EDGE_CLASS}>
          {t('common.pagination.next')}
        </Link>
      ) : (
        <span className={EDGE_DISABLED_CLASS}>{t('common.pagination.next')}</span>
      )}
    </nav>
  );
}

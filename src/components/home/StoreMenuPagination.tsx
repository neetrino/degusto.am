'use client';

import Link from 'next/link';
import type { MouseEvent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { getCompactPaginationPages } from '../../lib/utils/compact-pagination-pages';

export type StoreMenuPaginationProps = {
  navAriaLabel: string;
  currentPage: number;
  totalPages: number;
  buildPageHref: (page: number) => string;
  /** Client-side page change without RSC navigation (shop soft nav). */
  onSoftNavigate?: (href: string) => void;
};

const PAGE_LINK_CLASS =
  'flex h-10 min-w-[2.5rem] items-center justify-center rounded-full border border-[#dedede] bg-white px-3 text-sm font-semibold text-[#3c2f2f] transition hover:border-[#ff7f20] hover:bg-[#fff5ed]';
const PAGE_CURRENT_CLASS =
  'flex h-10 min-w-[2.5rem] items-center justify-center rounded-full bg-[#ff7f20] px-3 text-sm font-bold text-white';
const MOBILE_EDGE_LINK_CLASS =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dedede] bg-white text-[#3c2f2f] transition hover:border-[#ff7f20] hover:bg-[#fff5ed] lg:min-w-[5.5rem] lg:w-auto lg:px-4 lg:py-2 lg:text-sm lg:font-semibold';
const MOBILE_EDGE_DISABLED_CLASS =
  'flex h-10 w-10 shrink-0 cursor-default items-center justify-center rounded-full border border-[#e4e4e7] bg-[#fafafc] text-[#a1a1aa] lg:min-w-[5.5rem] lg:w-auto lg:px-4 lg:py-2 lg:text-sm lg:font-medium';
const DESKTOP_EDGE_LABEL_CLASS = 'hidden lg:inline';
/** Extra space between arrow controls and page numbers on mobile only. */
const MOBILE_PAGE_NUMBERS_INSET_CLASS = 'mx-3 lg:mx-0';

type PaginationChevronProps = {
  direction: 'previous' | 'next';
};

function PaginationChevron({ direction }: PaginationChevronProps) {
  const path =
    direction === 'previous' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7';

  return (
    <svg
      className="h-5 w-5 lg:hidden"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={path} />
    </svg>
  );
}

export function StoreMenuPagination({
  navAriaLabel,
  currentPage,
  totalPages,
  buildPageHref,
  onSoftNavigate,
}: StoreMenuPaginationProps) {
  const { t } = useTranslation();
  const items = useMemo(
    () => getCompactPaginationPages(totalPages, currentPage),
    [totalPages, currentPage]
  );

  const handleSoftNavigate = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!onSoftNavigate) {
      return;
    }
    event.preventDefault();
    onSoftNavigate(href);
  };

  if (totalPages <= 1) {
    return null;
  }

  const previousHref = buildPageHref(currentPage - 1);
  const nextHref = buildPageHref(currentPage + 1);

  return (
    <nav
      className="mt-16 flex flex-nowrap items-center justify-center gap-1 lg:flex-wrap lg:gap-2"
      aria-label={navAriaLabel}
    >
      {currentPage > 1 ? (
        <Link
          href={previousHref}
          onClick={(event) => handleSoftNavigate(event, previousHref)}
          className={MOBILE_EDGE_LINK_CLASS}
          aria-label={t('common.pagination.previous')}
        >
          <PaginationChevron direction="previous" />
          <span className={DESKTOP_EDGE_LABEL_CLASS}>{t('common.pagination.previous')}</span>
        </Link>
      ) : (
        <span className={MOBILE_EDGE_DISABLED_CLASS} aria-disabled="true">
          <PaginationChevron direction="previous" />
          <span className={DESKTOP_EDGE_LABEL_CLASS}>{t('common.pagination.previous')}</span>
        </span>
      )}

      <div
        className={`flex flex-nowrap items-center justify-center gap-1 lg:flex-wrap ${MOBILE_PAGE_NUMBERS_INSET_CLASS}`}
      >
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
                <Link
                  href={buildPageHref(item)}
                  onClick={(event) => handleSoftNavigate(event, buildPageHref(item))}
                  className={PAGE_LINK_CLASS}
                >
                  {item}
                </Link>
              )}
            </span>
          )
        )}
      </div>

      {currentPage < totalPages ? (
        <Link
          href={nextHref}
          onClick={(event) => handleSoftNavigate(event, nextHref)}
          className={MOBILE_EDGE_LINK_CLASS}
          aria-label={t('common.pagination.next')}
        >
          <PaginationChevron direction="next" />
          <span className={DESKTOP_EDGE_LABEL_CLASS}>{t('common.pagination.next')}</span>
        </Link>
      ) : (
        <span className={MOBILE_EDGE_DISABLED_CLASS} aria-disabled="true">
          <PaginationChevron direction="next" />
          <span className={DESKTOP_EDGE_LABEL_CLASS}>{t('common.pagination.next')}</span>
        </span>
      )}
    </nav>
  );
}

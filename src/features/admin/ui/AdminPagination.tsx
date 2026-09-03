import Link from "next/link";

import {
  ADMIN_LINK,
  ADMIN_PAGINATION,
} from "@/features/admin/ui/admin-form-classes";

type AdminPaginationProps = {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
  ariaLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
};

/**
 * Numbered admin list pagination with ellipsis (Previous / pages / Next).
 */
export function AdminPagination({
  currentPage,
  totalPages,
  buildHref,
  ariaLabel = "Pagination",
  previousLabel = "Previous",
  nextLabel = "Next",
}: AdminPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav aria-label={ariaLabel} className={ADMIN_PAGINATION}>
      {currentPage > 1 ? (
        <Link href={buildHref(currentPage - 1)} className={ADMIN_LINK}>
          {previousLabel}
        </Link>
      ) : (
        <span className="cursor-default text-[#c4bdb3]">{previousLabel}</span>
      )}

      <span className="mx-1 text-[#c4bdb3]" aria-hidden>
        |
      </span>

      {pages.map((page, index) =>
        page === "…" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1.5 text-[#8a837a]"
            aria-hidden
          >
            …
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#ff7f20] px-2 text-sm font-semibold text-white"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={buildHref(page)}
            className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 font-medium text-[#5c564e] transition-colors hover:bg-[#fff4eb] hover:text-[#ff7f20]"
          >
            {page}
          </Link>
        ),
      )}

      <span className="mx-1 text-[#c4bdb3]" aria-hidden>
        |
      </span>

      {currentPage < totalPages ? (
        <Link href={buildHref(currentPage + 1)} className={ADMIN_LINK}>
          {nextLabel}
        </Link>
      ) : (
        <span className="cursor-default text-[#c4bdb3]">{nextLabel}</span>
      )}
    </nav>
  );
}

function buildPageList(
  current: number,
  total: number,
): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current]);
  for (const offset of [-1, 1]) {
    const page = current + offset;
    if (page > 1 && page < total) {
      pages.add(page);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "…"> = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) {
      result.push("…");
    }
    result.push(page);
    previous = page;
  }
  return result;
}

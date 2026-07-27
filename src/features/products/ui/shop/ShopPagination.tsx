import { AppLink } from "@/components/ui/AppLink";

type ShopPaginationProps = {
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

/** Numbered catalog pagination with ellipsis — live shop parity. */
export function ShopPagination({
  ariaLabel,
  previousLabel,
  nextLabel,
  currentPage,
  totalPages,
  buildHref,
}: ShopPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPageList(currentPage, totalPages);

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-16 flex flex-nowrap items-center justify-center gap-1 lg:flex-wrap lg:gap-2"
    >
      {currentPage > 1 ? (
        <AppLink
          href={buildHref(currentPage - 1)}
          prefetchPolicy="intent"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dedede] bg-white text-sm font-medium text-product-ink transition hover:border-[#ff7f20] hover:bg-[#fff5ed] lg:min-w-[5.5rem] lg:w-auto lg:px-4 lg:py-2"
        >
          <span className="lg:hidden" aria-hidden>
            ‹
          </span>
          <span className="hidden lg:inline">{previousLabel}</span>
        </AppLink>
      ) : (
        <span className="flex h-10 w-10 shrink-0 cursor-default items-center justify-center rounded-full border border-[#e4e4e7] bg-[#fafafc] text-[#a1a1aa] lg:min-w-[5.5rem] lg:w-auto lg:px-4 lg:py-2 lg:text-sm lg:font-medium">
          <span className="lg:hidden" aria-hidden>
            ‹
          </span>
          <span className="hidden lg:inline">{previousLabel}</span>
        </span>
      )}

      {pages.map((page, index) =>
        page === "…" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm font-medium text-[#717182]"
          >
            …
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className="flex h-10 min-w-10 items-center justify-center rounded-full bg-[#ff7f20] px-3 text-sm font-bold text-white"
          >
            {page}
          </span>
        ) : (
          <AppLink
            key={page}
            href={buildHref(page)}
            prefetchPolicy="intent"
            className="flex h-10 min-w-10 items-center justify-center rounded-full border border-[#dedede] bg-white px-3 text-sm font-semibold text-product-ink transition hover:border-[#ff7f20] hover:bg-[#fff5ed]"
          >
            {page}
          </AppLink>
        ),
      )}

      {currentPage < totalPages ? (
        <AppLink
          href={buildHref(currentPage + 1)}
          prefetchPolicy="intent"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dedede] bg-white text-sm font-medium text-product-ink transition hover:border-[#ff7f20] hover:bg-[#fff5ed] lg:min-w-[5.5rem] lg:w-auto lg:px-4 lg:py-2"
        >
          <span className="lg:hidden" aria-hidden>
            ›
          </span>
          <span className="hidden lg:inline">{nextLabel}</span>
        </AppLink>
      ) : (
        <span className="flex h-10 w-10 shrink-0 cursor-default items-center justify-center rounded-full border border-[#e4e4e7] bg-[#fafafc] text-[#a1a1aa] lg:min-w-[5.5rem] lg:w-auto lg:px-4 lg:py-2 lg:text-sm lg:font-medium">
          <span className="lg:hidden" aria-hidden>
            ›
          </span>
          <span className="hidden lg:inline">{nextLabel}</span>
        </span>
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

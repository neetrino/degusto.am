import { AppLink } from "@/components/ui/AppLink";

type ShopPaginationProps = {
  ariaLabel: string;
  firstLabel: string;
  previousLabel: string;
  nextLabel: string;
  lastLabel: string;
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

const CIRCLE_BASE =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition";

const CIRCLE_IDLE = `${CIRCLE_BASE} border border-[#dedede] bg-white text-product-ink hover:border-brand hover:bg-[#fff5ed]`;

const CIRCLE_ACTIVE = `${CIRCLE_BASE} bg-brand font-bold text-white`;

const CIRCLE_DISABLED = `${CIRCLE_BASE} cursor-default border border-transparent bg-brand/10 text-brand/35`;

/** Compact circular catalog pagination — first / prev / pages / next / last. */
export function ShopPagination({
  ariaLabel,
  firstLabel,
  previousLabel,
  nextLabel,
  lastLabel,
  currentPage,
  totalPages,
  buildHref,
}: ShopPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPageList(currentPage, totalPages);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-16 flex w-fit max-w-full flex-nowrap items-center justify-center gap-2 self-center mx-auto"
    >
      <NavCircle
        href={isFirst ? undefined : buildHref(1)}
        label={firstLabel}
        disabled={isFirst}
      >
        «
      </NavCircle>
      <NavCircle
        href={isFirst ? undefined : buildHref(currentPage - 1)}
        label={previousLabel}
        disabled={isFirst}
      >
        ‹
      </NavCircle>

      {pages.map((page, index) =>
        page === "…" ? (
          <span
            key={`ellipsis-${index}`}
            className="px-1 text-sm font-medium text-[#717182]"
            aria-hidden
          >
            …
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className={CIRCLE_ACTIVE}
          >
            {page}
          </span>
        ) : (
          <AppLink
            key={page}
            href={buildHref(page)}
            prefetchPolicy="intent"
            className={CIRCLE_IDLE}
          >
            {page}
          </AppLink>
        ),
      )}

      <NavCircle
        href={isLast ? undefined : buildHref(currentPage + 1)}
        label={nextLabel}
        disabled={isLast}
      >
        ›
      </NavCircle>
      <NavCircle
        href={isLast ? undefined : buildHref(totalPages)}
        label={lastLabel}
        disabled={isLast}
      >
        »
      </NavCircle>
    </nav>
  );
}

type NavCircleProps = {
  href?: string;
  label: string;
  disabled: boolean;
  children: string;
};

function NavCircle({ href, label, disabled, children }: NavCircleProps) {
  if (disabled || !href) {
    return (
      <span
        aria-label={label}
        aria-disabled="true"
        className={CIRCLE_DISABLED}
      >
        <span aria-hidden>{children}</span>
      </span>
    );
  }

  return (
    <AppLink
      href={href}
      prefetchPolicy="intent"
      aria-label={label}
      className={CIRCLE_IDLE}
    >
      <span aria-hidden>{children}</span>
    </AppLink>
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

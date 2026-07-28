import { AppLink } from "@/components/ui/AppLink";

type WishlistEmptyStateProps = {
  title: string;
  description: string;
  loginLabel?: string;
  loginHref?: string;
  viewProductsLabel: string;
  viewProductsHref: string;
};

/**
 * Centered empty wishlist panel matching live degusto-am.
 */
export function WishlistEmptyState({
  title,
  description,
  loginLabel,
  loginHref,
  viewProductsLabel,
  viewProductsHref,
}: WishlistEmptyStateProps) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto max-w-md">
        <div
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center text-brand"
          aria-hidden
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            className="shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M12,21.35L10.55,20.03C5.4,15.36,2,12.28,2,8.5C2,5.42,4.42,3,7.5,3C9.24,3,10.91,3.81,12,5.08C13.09,3.81,14.76,3,16.5,3C19.58,3,22,5.42,22,8.5C22,12.28,18.6,15.36,13.45,20.04L12,21.35Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">{title}</h2>
        <p className="mb-4 text-sm text-gray-600">{description}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {loginLabel && loginHref ? (
            <AppLink
              href={loginHref}
              prefetchPolicy="intent"
              className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-base font-medium text-white transition-colors hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {loginLabel}
            </AppLink>
          ) : null}
          <AppLink
            href={viewProductsHref}
            prefetchPolicy="intent"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-base font-medium text-white transition-colors hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {viewProductsLabel}
          </AppLink>
        </div>
      </div>
    </div>
  );
}

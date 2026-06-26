type AdminPageLoadingProps = {
  ariaLabel?: string;
};

/** Admin / supersudo — neutral gray spinner. */
export function AdminPageLoading({ ariaLabel = 'Loading admin' }: AdminPageLoadingProps) {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center py-24"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
    </div>
  );
}

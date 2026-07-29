import { LoaderCircle } from "lucide-react";

type ShopCatalogLoadingStateProps = {
  label: string;
};

/** Visible catalog loading status for search / filter navigations. */
export function ShopCatalogLoadingState({ label }: ShopCatalogLoadingStateProps) {
  return (
    <div
      className="flex min-h-[320px] flex-col items-center justify-center rounded-[28px] bg-[#f7f7f8] px-6 py-16 text-center"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <LoaderCircle
        className="h-10 w-10 animate-spin text-[#ff7f20]"
        strokeWidth={2}
        aria-hidden
      />
      <p className="mt-5 text-xl font-semibold tracking-tight text-[#1a1a1a]">
        {label}
      </p>
    </div>
  );
}

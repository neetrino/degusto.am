import { STOREFRONT_PAGE_CONTAINER_CLASS } from '@/constants/storefront-desktop-layout';
import { STOREFRONT_SKELETON_PULSE_CLASS } from '@/components/routing/storefront-skeleton.constants';

type ComparePageLoadingProps = {
  ariaLabel?: string;
};

/** Compare table skeleton — product columns on white. */
export function ComparePageLoading({ ariaLabel = 'Loading compare' }: ComparePageLoadingProps) {
  return (
    <div
      className={`${STOREFRONT_PAGE_CONTAINER_CLASS} py-6`}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className={`mb-6 h-9 w-56 rounded-lg ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
      <div className="overflow-hidden rounded-2xl border border-[#ededed]">
        <div className="grid grid-cols-4 gap-4 border-b border-[#ededed] bg-[#fafafa] p-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={`h-32 rounded-xl ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
          ))}
        </div>
        {Array.from({ length: 5 }, (_, row) => (
          <div key={row} className="grid grid-cols-4 gap-4 border-b border-[#ededed] p-4 last:border-0">
            {Array.from({ length: 4 }, (_, col) => (
              <div key={col} className={`h-5 rounded ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

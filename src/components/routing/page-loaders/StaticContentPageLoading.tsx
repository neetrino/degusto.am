import { STOREFRONT_PAGE_CONTAINER_CLASS } from '@/constants/storefront-desktop-layout';
import { STOREFRONT_SKELETON_PULSE_CLASS } from '@/components/routing/storefront-skeleton.constants';

type StaticContentPageLoadingProps = {
  ariaLabel?: string;
};

/** FAQ, contact, legal, support — white content page skeleton. */
export function StaticContentPageLoading({
  ariaLabel = 'Loading page',
}: StaticContentPageLoadingProps) {
  return (
    <div
      className={`${STOREFRONT_PAGE_CONTAINER_CLASS} py-8 md:py-12`}
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className={`mb-8 h-10 w-64 max-w-full rounded-lg ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
      <div className="space-y-4 max-w-3xl">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className={`h-4 rounded ${STOREFRONT_SKELETON_PULSE_CLASS}`}
            style={{ width: `${88 - index * 6}%` }}
          />
        ))}
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className={`h-32 rounded-2xl ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
        <div className={`h-32 rounded-2xl ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
      </div>
    </div>
  );
}

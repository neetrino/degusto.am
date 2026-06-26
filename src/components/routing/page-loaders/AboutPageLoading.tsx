import { STOREFRONT_SKELETON_PULSE_CLASS } from '@/components/routing/storefront-skeleton.constants';

type AboutPageLoadingProps = {
  ariaLabel?: string;
};

/** About page — cream botanical surface skeleton. */
export function AboutPageLoading({ ariaLabel = 'Loading about' }: AboutPageLoadingProps) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#FBF6EA]"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className={`mb-8 h-12 w-2/3 max-w-md rounded-xl ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
        <div className={`mb-6 h-64 rounded-3xl ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={`h-28 rounded-2xl ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
          ))}
        </div>
        <div className="mt-8 space-y-3">
          <div className={`h-4 w-full rounded ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
          <div className={`h-4 w-11/12 rounded ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
          <div className={`h-4 w-10/12 rounded ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
        </div>
      </div>
    </div>
  );
}

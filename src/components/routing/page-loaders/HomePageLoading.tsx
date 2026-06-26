import { STOREFRONT_SKELETON_PULSE_CLASS } from '@/components/routing/storefront-skeleton.constants';

type HomePageLoadingProps = {
  ariaLabel?: string;
};

/** Home — hero + featured product row skeleton. */
export function HomePageLoading({ ariaLabel = 'Loading home' }: HomePageLoadingProps) {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label={ariaLabel}>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-8">
        <div className={`h-64 rounded-3xl ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className={`h-48 rounded-2xl ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

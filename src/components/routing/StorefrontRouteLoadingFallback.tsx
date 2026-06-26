import { STOREFRONT_SKELETON_PULSE_CLASS } from './storefront-skeleton.constants';

/** Root-level storefront navigation fallback — always visible, never white-on-white. */
export function StorefrontRouteLoadingFallback() {
  return (
    <div
      className="min-h-[40vh] bg-white px-4 py-8"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className={`mx-auto mb-6 h-10 max-w-md rounded-xl ${STOREFRONT_SKELETON_PULSE_CLASS}`} />
      <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={`h-40 rounded-2xl ${STOREFRONT_SKELETON_PULSE_CLASS}`}
          />
        ))}
      </div>
    </div>
  );
}

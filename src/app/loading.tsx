import { StorefrontRouteLoadingFallback } from '@/components/routing/StorefrontRouteLoadingFallback';

/** Global navigation fallback — layout chrome stays mounted; this fills the main slot. */
export default function RootLoading() {
  return <StorefrontRouteLoadingFallback />;
}

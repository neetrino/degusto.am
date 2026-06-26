import { createLazyClientPage } from '@/lib/routing/create-lazy-client-page';
import { ProfilePageLoadingSkeleton } from '@/components/routing/ProfilePageLoadingSkeleton';

export default createLazyClientPage(() => import("./PageClient"), ProfilePageLoadingSkeleton);

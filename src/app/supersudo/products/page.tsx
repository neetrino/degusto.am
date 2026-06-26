import { createLazyClientPage } from '@/lib/routing/create-lazy-client-page';
import { AdminPageLoading } from '@/components/routing/page-loaders';

export default createLazyClientPage(() => import("./PageClient"), AdminPageLoading);

import { createLazyClientPage } from '@/lib/routing/create-lazy-client-page';
import { AuthPageLoading } from '@/components/routing/page-loaders';

export default createLazyClientPage(() => import("./PageClient"), AuthPageLoading);

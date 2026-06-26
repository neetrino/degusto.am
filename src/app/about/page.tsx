import { createLazyClientPage } from '@/lib/routing/create-lazy-client-page';
import { AboutPageLoading } from '@/components/routing/page-loaders';

export default createLazyClientPage(() => import("./PageClient"), AboutPageLoading);

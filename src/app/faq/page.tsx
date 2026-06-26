import { createLazyClientPage } from '@/lib/routing/create-lazy-client-page';
import { StaticContentPageLoading } from '@/components/routing/page-loaders';

export default createLazyClientPage(() => import("./PageClient"), StaticContentPageLoading);

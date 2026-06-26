import { createLazyClientPage } from '@/lib/routing/create-lazy-client-page';
import { CheckoutPageLoading } from '@/components/routing/page-loaders';

export default createLazyClientPage(() => import("./PageClient"), CheckoutPageLoading);

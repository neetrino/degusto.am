import { createLazyClientPage } from '@/lib/routing/create-lazy-client-page';
import { WishlistPageLoading } from '@/components/routing/page-loaders';

export default createLazyClientPage(() => import("./PageClient"), WishlistPageLoading);

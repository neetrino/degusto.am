import { unstable_cache } from "next/cache";
import { STOREFRONT_ISR_REVALIDATE_SECONDS } from "@/constants/storefront-isr";
import { adminDeliveryService } from "@/lib/services/admin/admin-delivery.service";

/** `revalidateTag` when admin updates delivery locations. */
export const STOREFRONT_DELIVERY_LOCATIONS_CACHE_TAG = "storefront-delivery-locations";

const REVALIDATE_SECONDS = STOREFRONT_ISR_REVALIDATE_SECONDS;

const loadPublicDeliveryLocationsCached = unstable_cache(
  () => adminDeliveryService.getPublicDeliveryLocations(),
  ["storefront-delivery-locations-v1"],
  {
    revalidate: REVALIDATE_SECONDS,
    tags: [STOREFRONT_DELIVERY_LOCATIONS_CACHE_TAG],
  }
);

/** Cached public city list derived from admin delivery settings. */
export function getPublicDeliveryLocationsCached(): Promise<{ cities: string[] }> {
  return loadPublicDeliveryLocationsCached();
}

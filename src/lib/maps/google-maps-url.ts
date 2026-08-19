const MAPS_SEARCH_BASE = "https://www.google.com/maps/search/?api=1";
const MAPS_LOCATION_SUFFIX = "Yerevan, Armenia";

/** Builds a Google Maps search URL for a Degusto storefront address. */
export function googleMapsSearchUrl(address: string): string {
  const query = `${address}, ${MAPS_LOCATION_SUFFIX}`;
  return `${MAPS_SEARCH_BASE}&query=${encodeURIComponent(query)}`;
}

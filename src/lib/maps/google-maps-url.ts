const MAPS_SEARCH_BASE = "https://www.google.com/maps/search/?api=1";
const MAPS_EMBED_BASE = "https://maps.google.com/maps";
const MAPS_LOCATION_SUFFIX = "Yerevan, Armenia";

/** Builds a Google Maps search URL for a Degusto storefront address. */
export function googleMapsSearchUrl(address: string): string {
  const query = `${address}, ${MAPS_LOCATION_SUFFIX}`;
  return `${MAPS_SEARCH_BASE}&query=${encodeURIComponent(query)}`;
}

/** Builds a lazy-loadable Google Maps embed URL for a storefront address. */
export function googleMapsEmbedUrl(address: string): string {
  const query = `${address}, ${MAPS_LOCATION_SUFFIX}`;
  const params = new URLSearchParams({
    q: query,
    z: "16",
    ie: "UTF8",
    iwloc: "",
    output: "embed",
  });
  return `${MAPS_EMBED_BASE}?${params.toString()}`;
}

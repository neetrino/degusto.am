/**
 * In `next dev`, PDP gallery is padded to this many distinct URLs so thumbnails
 * can be tested without seeding or admin uploads. Stripped in production builds.
 */
export const DEMO_PDP_GALLERY_TARGET_COUNT = 3;

/** Known-distinct paths under `/api/r2/` (same assets as marketing pages). */
export const DEMO_PDP_GALLERY_URLS: readonly string[] = [
  '/api/r2/product/20260512-5XM6tLjCRv.png',
  '/api/r2/product/20260512-D3w_teddze.png',
  '/api/r2/category/20260512-Np6RG2GuNi.png',
];

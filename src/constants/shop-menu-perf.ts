/** Published variants sampled per product on shop menu fast path (food-attribute badges). */
export const SHOP_MENU_FAST_VARIANT_SAMPLE_SIZE = 3;

/** First visible product photos to load eagerly (2×2 mobile grid). */
export const SHOP_ABOVE_FOLD_MOBILE_IMAGE_COUNT = 4;

/** First desktop grid row (3 columns). */
export const SHOP_ABOVE_FOLD_DESKTOP_IMAGE_COUNT = 3;

/** Next/Image `sizes` for shop product cards. */
export const SHOP_MOBILE_PRODUCT_IMAGE_SIZES = '(max-width: 1024px) 46vw, 50vw';
export const SHOP_DESKTOP_PRODUCT_IMAGE_SIZES =
  '(min-width: 1280px) 24vw, (min-width: 1024px) 30vw, 50vw';

/** Client cache fresh window — matches API Cache-Control max-age=30. */
export const SHOP_MENU_CLIENT_CACHE_FRESH_MS = 30_000;

/** Max client cache age before prices/stock must be refetched. */
export const SHOP_MENU_CLIENT_CACHE_MAX_AGE_MS = 120_000;

/** Adjacent categories to prefetch on idle after shop load. */
export const SHOP_MENU_IDLE_PREFETCH_NEIGHBOR_COUNT = 2;

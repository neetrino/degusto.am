import { r2Asset } from '@/lib/r2-public-url';

export const FIGMA_DESKTOP_SHOP_ASSETS = {
  productCardAddToCart: r2Asset('product/20260512-g67zkm13ZH.svg'),
  productCardHot: r2Asset('product/20260512-dWv7-ZfxP1.svg'),
  productCardRibbon: r2Asset('product/20260512-lmzrYlGD39.svg'),
  productCardStar: r2Asset('product/20260512-7jf6Wihrew.svg'),
  switcherLeafRibbon: r2Asset('product/20260512-vCDQ1I3ZtJ.svg'),
  switcherPepper: r2Asset('product/20260512-dWv7-ZfxP1.svg'),
} as const;

/** Desktop shop grid card — 3 columns, taller product photo (was 147px @ 227px wide). */
export const DESKTOP_MENU_CARD_HEIGHT_CLASS = 'h-[330px]';
export const DESKTOP_MENU_CARD_META_TOP_CLASS = 'top-[215px]';
export const DESKTOP_MENU_CARD_TITLE_TOP_CLASS = 'top-[239px]';
export const DESKTOP_MENU_CARD_PRICE_TOP_CLASS = 'top-[282px]';
export const DESKTOP_MENU_CARD_COMPARE_PRICE_TOP_CLASS = 'top-[308px]';
export const DESKTOP_MENU_CARD_IMAGE_FRAME_CLASS =
  'relative mx-auto mt-1 h-[180px] w-[calc(100%-10px)]';

/** Debounce before writing search to the URL (server refetch); avoids one request per key. */
export const SEARCH_QUERY_URL_DEBOUNCE_MS = 250;
/** Debounce min/max price URL updates (same reason as search). */
export const PRICE_FILTER_URL_DEBOUNCE_MS = 300;

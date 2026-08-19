export const CATEGORIES_PER_PAGE = 5;
export const CATEGORY_LOOP_COPIES = 3;

/** How many snap pages a circular, always-full strip needs. */
export function categoryLogicalPageCount(itemCount: number): number {
  if (itemCount <= 0) {
    return 0;
  }
  return Math.max(1, Math.ceil(itemCount / CATEGORIES_PER_PAGE));
}

/** Slot index into the source list, wrapping so every page has five items. */
export function categoryLoopItemIndex(
  itemCount: number,
  pageIndex: number,
  slot: number,
): number {
  if (itemCount <= 0) {
    return 0;
  }
  return (pageIndex * CATEGORIES_PER_PAGE + slot) % itemCount;
}

/**
 * Keeps the scroller on the middle copy of a 3× loop track.
 * First copy jumps forward; third copy jumps backward.
 */
export function wrapCategoryLoopIndex(
  rawIndex: number,
  logicalCount: number,
): { index: number; jumped: boolean } {
  if (logicalCount <= 0) {
    return { index: 0, jumped: false };
  }
  if (rawIndex < logicalCount) {
    return { index: rawIndex + logicalCount, jumped: true };
  }
  if (rawIndex >= logicalCount * 2) {
    return { index: rawIndex - logicalCount, jumped: true };
  }
  return { index: rawIndex, jumped: false };
}

export function logicalCategoryPage(
  loopIndex: number,
  logicalCount: number,
): number {
  if (logicalCount <= 0) {
    return 0;
  }
  return ((loopIndex % logicalCount) + logicalCount) % logicalCount;
}

const SNAP_SETTLE_EPSILON = 0.02;

/** Nearest page index once the scroller has snapped, otherwise null. */
export function settledCategoryLoopIndex(
  scrollLeft: number,
  width: number,
): number | null {
  if (width <= 0) {
    return null;
  }
  const raw = scrollLeft / width;
  const nearest = Math.round(raw);
  if (Math.abs(raw - nearest) > SNAP_SETTLE_EPSILON) {
    return null;
  }
  return nearest;
}

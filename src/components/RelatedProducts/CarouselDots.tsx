'use client';

interface CarouselDotsProps {
  totalItems: number;
  visibleItems: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  /** When set (e.g. 2 on mobile), one dot per page of visible items instead of per product. */
  scrollStep?: number;
}

const LAST_DOT_INDEX_MIN = 1;

/**
 * Dots for carousel: per scroll position when multiple items are visible, else per product.
 */
export function CarouselDots({
  totalItems,
  visibleItems,
  currentIndex,
  onDotClick,
  scrollStep = 1,
}: CarouselDotsProps) {
  const maxIndex = Math.max(0, totalItems - visibleItems);
  const step = Math.max(1, scrollStep);
  const usePageDots = step > 1 && step === visibleItems;
  const useScrollPositionDots = !usePageDots && visibleItems > 1 && step === 1;
  const dotCount = usePageDots
    ? Math.ceil(totalItems / visibleItems)
    : useScrollPositionDots
      ? maxIndex + 1
      : totalItems;
  const lastDotIndex = Math.max(LAST_DOT_INDEX_MIN, dotCount - 1);

  const activePillIndex = usePageDots
    ? Math.min(lastDotIndex, Math.floor(currentIndex / step))
    : useScrollPositionDots
      ? Math.min(lastDotIndex, currentIndex)
      : maxIndex === 0
        ? 0
        : Math.round((currentIndex / maxIndex) * lastDotIndex);

  const handleDotClick = (dotIndex: number) => {
    if (maxIndex === 0) {
      return;
    }
    if (usePageDots) {
      onDotClick(Math.min(dotIndex * step, maxIndex));
      return;
    }
    if (useScrollPositionDots) {
      onDotClick(Math.min(dotIndex, maxIndex));
      return;
    }
    const targetIndex = Math.round((dotIndex / lastDotIndex) * maxIndex);
    onDotClick(targetIndex);
  };

  return (
    <div className="mt-3 flex justify-center gap-2">
      {Array.from({ length: dotCount }).map((_, dotIndex) => {
        const isActive = dotIndex === activePillIndex;

        return (
          <button
            key={dotIndex}
            type="button"
            onClick={() => handleDotClick(dotIndex)}
            aria-disabled={maxIndex === 0}
            className={`h-2 rounded-full transition-all duration-300 ${
              maxIndex === 0 ? 'cursor-default' : ''
            } ${
              isActive
                ? 'w-8 bg-gray-900'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={
              usePageDots
                ? `Go to page ${dotIndex + 1}`
                : useScrollPositionDots
                  ? `Go to slide ${dotIndex + 1}`
                  : `Go to product ${dotIndex + 1}`
            }
            aria-current={isActive ? 'true' : undefined}
          />
        );
      })}
    </div>
  );
}

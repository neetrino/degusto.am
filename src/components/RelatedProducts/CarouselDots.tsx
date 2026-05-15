'use client';

interface CarouselDotsProps {
  totalItems: number;
  visibleItems: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
}

const LAST_DOT_INDEX_MIN = 1;

/**
 * One dot per product. Pill maps linearly from first dot (start) to last dot (end scroll).
 */
export function CarouselDots({ totalItems, visibleItems, currentIndex, onDotClick }: CarouselDotsProps) {
  const maxIndex = Math.max(0, totalItems - visibleItems);
  const lastDotIndex = Math.max(LAST_DOT_INDEX_MIN, totalItems - 1);

  const activePillIndex =
    maxIndex === 0
      ? 0
      : Math.round((currentIndex / maxIndex) * lastDotIndex);

  const handleDotClick = (dotIndex: number) => {
    if (maxIndex === 0) {
      return;
    }
    const targetIndex = Math.round((dotIndex / lastDotIndex) * maxIndex);
    onDotClick(targetIndex);
  };

  return (
    <div className="flex justify-center gap-2 mt-3">
      {Array.from({ length: totalItems }).map((_, dotIndex) => {
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
                ? 'bg-gray-900 w-8'
                : 'bg-gray-300 hover:bg-gray-400 w-2'
            }`}
            aria-label={`Go to product ${dotIndex + 1}`}
            aria-current={isActive ? 'true' : undefined}
          />
        );
      })}
    </div>
  );
}





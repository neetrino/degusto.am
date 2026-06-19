'use client';

interface RatingStarsProps {
  rating: number;
  starSrc: string;
  className?: string;
  starClassName?: string;
  emptyStarClassName?: string;
  filledStarClassName?: string;
  maxStars?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function RatingStars({
  rating,
  starSrc,
  className = '',
  starClassName = 'h-5 w-5',
  emptyStarClassName = 'opacity-35 grayscale',
  filledStarClassName = '',
  maxStars = 5,
}: RatingStarsProps) {
  const safeRating = clamp(rating, 0, maxStars);

  if (maxStars === 1) {
    return (
      <div className={className} aria-hidden>
        <img src={starSrc} alt="" className={`${starClassName} object-contain`} decoding="async" />
      </div>
    );
  }

  return (
    <div className={className} aria-hidden>
      {Array.from({ length: maxStars }, (_, index) => {
        const fillPercent = clamp((safeRating - index) * 100, 0, 100);
        return (
          <div key={index + 1} className="relative overflow-hidden">
            <img src={starSrc} alt="" className={`${starClassName} object-contain ${emptyStarClassName}`} />
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
              <img src={starSrc} alt="" className={`${starClassName} object-contain ${filledStarClassName}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

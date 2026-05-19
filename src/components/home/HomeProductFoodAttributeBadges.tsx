type HomeProductFoodAttributeBadgesProps = {
  supportsSpicy: boolean;
  supportsGreens: boolean;
  hotIconSrc: string;
  greensIconSrc: string;
  variant: 'desktop-card' | 'desktop-hero';
};

/**
 * Spicy / greens badges on Figma-style product cards (only when supported).
 */
export function HomeProductFoodAttributeBadges({
  supportsSpicy,
  supportsGreens,
  hotIconSrc,
  greensIconSrc,
  variant,
}: HomeProductFoodAttributeBadgesProps) {
  if (!supportsSpicy && !supportsGreens) {
    return null;
  }

  if (variant === 'desktop-hero') {
    return (
      <div className="absolute left-[11px] top-[8px] flex flex-col gap-[6px]">
        {supportsSpicy ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2b2e]">
            <img
              src={hotIconSrc}
              alt=""
              className="h-[19px] w-[19px] -rotate-[13deg] object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}
        {supportsGreens ? (
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
            <img
              src={greensIconSrc}
              alt=""
              className="h-8 w-8 scale-110 object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {supportsSpicy ? (
        <div className="absolute left-4 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff2b2e] p-1">
          <img
            src={hotIconSrc}
            alt=""
            className="h-[19px] w-[19px] -rotate-[13deg] object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}
      {supportsGreens ? (
        <div
          className={`absolute left-4 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ${
            supportsSpicy ? 'top-[58px]' : 'top-5'
          }`}
        >
          <img
            src={greensIconSrc}
            alt=""
            className="h-8 w-8 scale-110 object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}
    </>
  );
}
